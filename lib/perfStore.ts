/**
 * Browser-side store for the performance tier. Mirrors hooks/useTheme: the
 * source of truth is an attribute on <html> (set before paint by the inline
 * bootstrap in pages/_document.tsx), React subscribes with
 * useSyncExternalStore, and CSS keys off `html[data-perf]`.
 */
import {
  PERF_ATTRIBUTE,
  PERF_AUTO_KEY,
  PERF_STORAGE_KEY,
  classifyStaticSignals,
  isAutoReason,
  isPerfPreference,
  isPerfTier,
  lowerTier,
  resolveTier,
  tierFromFrameTimes,
  type AutoReason,
  type PerfPreference,
  type PerfTier,
  type StaticSignals,
} from "./perf";

/** sessionStorage keys alongside PERF_AUTO_KEY. */
const AUTO_REASON_KEY = "perf-auto-reason";
const PROBE_DONE_KEY = "perf-probed";

let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

const safeGet = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const safeSet = (storage: Storage | undefined, key: string, value: string | null) => {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Private mode or storage disabled; the attribute still works for this page.
  }
};

const local = () => (typeof window === "undefined" ? undefined : window.localStorage);
const session = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

export function getPreference(): PerfPreference {
  const raw = safeGet(local(), PERF_STORAGE_KEY);
  return isPerfPreference(raw) ? raw : "auto";
}

export function getAutoTier(): PerfTier {
  const raw = safeGet(session(), PERF_AUTO_KEY);
  return isPerfTier(raw) ? raw : "full";
}

export function getAutoReason(): AutoReason {
  const raw = safeGet(session(), AUTO_REASON_KEY);
  return isAutoReason(raw) ? raw : "capable";
}

export function getTier(): PerfTier {
  const raw = document.documentElement.getAttribute(PERF_ATTRIBUTE);
  return isPerfTier(raw) ? raw : "full";
}

export const getServerTier = (): PerfTier => "full";

function apply() {
  const tier = resolveTier(getPreference(), getAutoTier());
  document.documentElement.setAttribute(PERF_ATTRIBUTE, tier);
  emit();
}

function setAutoTier(tier: PerfTier, reason: AutoReason) {
  safeSet(session(), PERF_AUTO_KEY, tier);
  safeSet(session(), AUTO_REASON_KEY, reason);
  apply();
}

/**
 * Stores the visitor's choice. Picking "auto" also throws away this
 * session's cached detection and measures again, so switching back to Auto
 * is a real re-evaluation rather than a replay of an earlier verdict.
 */
export function setPreference(preference: PerfPreference) {
  safeSet(local(), PERF_STORAGE_KEY, preference === "auto" ? null : preference);
  if (preference === "auto") {
    redetect();
  } else {
    apply();
  }
}

// --- Detection ---

function readStaticSignals(): StaticSignals {
  let renderer: string | null = null;
  let webglAvailable = false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (gl) {
      webglAvailable = true;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) {
        renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "");
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webglAvailable = false;
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  return {
    renderer,
    webglAvailable,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: Boolean(nav.connection?.saveData),
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
  };
}

function detect() {
  const { tier, reason } = classifyStaticSignals(readStaticSignals());
  setAutoTier(tier, reason);
}

function redetect() {
  safeSet(session(), PROBE_DONE_KEY, null);
  detect();
  probeFrameRate();
}

let initialized = false;

/**
 * Runs once per page load: applies the stored preference, and on the first
 * page of a session runs the static detection. Cheap; safe to call from
 * several components.
 */
export function initPerf() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (!isPerfTier(safeGet(session(), PERF_AUTO_KEY))) {
    detect();
  } else {
    apply();
  }
}

// --- Frame-time probe ---

/** Let hydration, fonts, and shader compilation settle before sampling. */
const PROBE_DELAY_MS = 1000;
const PROBE_MS = 1500;
let probing = false;
let probeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Called by the shader components once they are rendering. Waits a moment,
 * then samples frame times and downgrades the auto tier if the page can't
 * keep up. Runs once per session and never upgrades, so a visitor already on
 * a lower tier is not re-measured on a lighter page.
 *
 * Skipped in development: dev-server compilation stalls would misreport a
 * capable machine as slow.
 */
export function probeFrameRate() {
  if (typeof window === "undefined" || probing || probeTimer) return;
  if (process.env.NODE_ENV !== "production") return;
  if (safeGet(session(), PROBE_DONE_KEY) === "1") return;
  if (getAutoTier() !== "full") {
    safeSet(session(), PROBE_DONE_KEY, "1");
    return;
  }

  probeTimer = setTimeout(() => {
    probeTimer = null;
    if (document.visibilityState !== "visible") return;
    runProbe();
  }, PROBE_DELAY_MS);
}

function runProbe() {
  probing = true;
  const deltas: number[] = [];
  let last = performance.now();
  const start = last;
  let raf = 0;

  const stop = (record: boolean) => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onHidden);
    probing = false;
    if (!record) return;
    safeSet(session(), PROBE_DONE_KEY, "1");
    const measured = tierFromFrameTimes(deltas);
    if (measured && measured !== "full") {
      setAutoTier(lowerTier(getAutoTier(), measured), "frame-rate");
    }
  };
  const onHidden = () => {
    if (document.visibilityState !== "visible") stop(false);
  };
  document.addEventListener("visibilitychange", onHidden);

  const tick = (now: number) => {
    deltas.push(now - last);
    last = now;
    if (now - start >= PROBE_MS) {
      stop(true);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

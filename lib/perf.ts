/**
 * Performance tiers for the GPU-heavy parts of the site (the WebGL shaders,
 * backdrop blur, accent tweens). Pure helpers live here so they can be unit
 * tested; the browser store that applies them is in lib/perfStore.ts.
 *
 *  - full:    everything on, as designed.
 *  - reduced: shaders at lower resolution and half frame rate, no mouse
 *             interaction with the shaders.
 *  - low:     shaders render one still frame, blur and accent tweens off,
 *             native cursor. For software rendering and very weak machines.
 */
export type PerfTier = "full" | "reduced" | "low";
/** What the visitor asked for; "auto" defers to detection + measurement. */
export type PerfPreference = PerfTier | "auto";

export const PERF_TIERS: readonly PerfTier[] = ["full", "reduced", "low"];
/** Toggle cycle order. "full" is here so an auto-downgraded visitor can override upward. */
export const PERF_PREFERENCES: readonly PerfPreference[] = ["auto", "full", "reduced", "low"];

/** localStorage key for the visitor's explicit choice. */
export const PERF_STORAGE_KEY = "perf";
/** sessionStorage key for the detected/measured tier, so navigation doesn't re-probe. */
export const PERF_AUTO_KEY = "perf-auto";
export const PERF_ATTRIBUTE = "data-perf";

export const isPerfTier = (v: unknown): v is PerfTier =>
  typeof v === "string" && (PERF_TIERS as readonly string[]).includes(v);

export const isPerfPreference = (v: unknown): v is PerfPreference =>
  v === "auto" || isPerfTier(v);

export const resolveTier = (preference: PerfPreference, auto: PerfTier): PerfTier =>
  preference === "auto" ? auto : preference;

const rank: Record<PerfTier, number> = { full: 0, reduced: 1, low: 2 };
/** The slower of two tiers. */
export const lowerTier = (a: PerfTier, b: PerfTier): PerfTier =>
  rank[a] >= rank[b] ? a : b;

/**
 * Renderer strings that mean WebGL is running on the CPU. These come from
 * WEBGL_debug_renderer_info's UNMASKED_RENDERER_WEBGL.
 */
const SOFTWARE_RENDERERS = [
  /swiftshader/i,
  /llvmpipe/i,
  /softpipe/i,
  /software/i,
  /microsoft basic render/i,
  /mesa offscreen/i,
  /apple software renderer/i,
];

export const isSoftwareRendererString = (renderer: string | null | undefined): boolean =>
  Boolean(renderer) && SOFTWARE_RENDERERS.some((re) => re.test(renderer as string));

export interface StaticSignals {
  renderer: string | null;
  /** null when WebGL could not be created at all. */
  webglAvailable: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
}

/** Why Auto landed on its tier; surfaced in the toggle's tooltip. */
export type AutoReason =
  | "capable"
  | "webgl-unavailable"
  | "software-renderer"
  | "reduced-motion"
  | "save-data"
  | "weak-device"
  | "frame-rate";

export const AUTO_REASON_LABELS: Record<AutoReason, string> = {
  capable: "",
  "webgl-unavailable": "WebGL unavailable",
  "software-renderer": "no GPU acceleration",
  "reduced-motion": "system reduce-motion setting",
  "save-data": "data saver on",
  "weak-device": "low-power device",
  "frame-rate": "measured frame rate",
};

export const isAutoReason = (v: unknown): v is AutoReason =>
  typeof v === "string" && v in AUTO_REASON_LABELS;

/**
 * What the OS-level reduce-motion preference maps to. "low" stops the
 * decorative shaders entirely, which is the honest reading of that setting.
 * Visitors who still want the full version can pick it from the toggle.
 */
export const REDUCED_MOTION_TIER: PerfTier = "low";

/**
 * Tier from signals that are known before anything renders. Conservative:
 * only definite "this machine can't do it" signals go straight to low.
 */
export function classifyStaticSignals(s: StaticSignals): {
  tier: PerfTier;
  reason: AutoReason;
} {
  if (!s.webglAvailable) return { tier: "low", reason: "webgl-unavailable" };
  if (isSoftwareRendererString(s.renderer)) {
    return { tier: "low", reason: "software-renderer" };
  }
  if (s.prefersReducedMotion) {
    return { tier: REDUCED_MOTION_TIER, reason: "reduced-motion" };
  }
  if (s.saveData) return { tier: "reduced", reason: "save-data" };
  const weakCpu = s.hardwareConcurrency !== null && s.hardwareConcurrency <= 2;
  const lowMemory = s.deviceMemory !== null && s.deviceMemory <= 2;
  if (weakCpu || lowMemory) return { tier: "reduced", reason: "weak-device" };
  return { tier: "full", reason: "capable" };
}

export const tierFromStaticSignals = (s: StaticSignals): PerfTier =>
  classifyStaticSignals(s).tier;

/** Frame-time thresholds in ms. 60 Hz is 16.7 ms; 120 Hz is 8.3 ms. */
export const FRAME_MS_REDUCED = 28; // below ~36 fps
export const FRAME_MS_LOW = 55; // below ~18 fps
const WARMUP_FRAMES = 8;
const MIN_SAMPLES = 20;

/**
 * Tier from a run of requestAnimationFrame deltas taken while a shader is
 * on screen. Uses the 75th percentile so a couple of GC pauses don't
 * downgrade a fine machine, but a consistently slow one still does.
 * Returns null when there aren't enough samples to judge.
 */
export function tierFromFrameTimes(deltasMs: readonly number[]): PerfTier | null {
  const samples = deltasMs
    .slice(WARMUP_FRAMES)
    .filter((d) => Number.isFinite(d) && d > 0 && d < 1000);
  if (samples.length < MIN_SAMPLES) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const p75 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
  if (p75 > FRAME_MS_LOW) return "low";
  if (p75 > FRAME_MS_REDUCED) return "reduced";
  return "full";
}

/** Canvas resolution multiplier applied on top of the device pixel ratio cap. */
export const dprForTier = (tier: PerfTier, devicePixelRatio: number, cap = 2): number => {
  const base = Math.min(devicePixelRatio || 1, cap);
  switch (tier) {
    case "full":
      return base;
    case "reduced":
      return Math.max(0.5, Math.min(base, 1) * 0.6);
    case "low":
      return 0.5;
  }
};

/** Target render rate per tier; 0 means a single still frame. */
export const fpsForTier = (tier: PerfTier): number => {
  switch (tier) {
    case "full":
      return 60;
    case "reduced":
      return 30;
    case "low":
      return 0;
  }
};

export const PERF_LABELS: Record<PerfPreference, string> = {
  auto: "Auto",
  full: "Full",
  reduced: "Reduced",
  low: "Minimal",
};

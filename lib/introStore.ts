/**
 * Browser-side runner and store for the boot intro (see lib/intro.ts).
 *
 * Same shape as lib/perfStore.ts: a module-level value, a listener list and
 * `subscribe` for useSyncExternalStore. The stage is mirrored onto
 * `<html data-intro>` so the CSS backdrop in styles/globals.css follows it.
 *
 * The runner is a module singleton rather than component state so React's
 * StrictMode double-mount, and the panel unmounting on `hidden`, can't
 * restart or tear down a sequence that is already running.
 */
import {
  DOCK_MS,
  INTRO_ATTRIBUTE,
  INTRO_SESSION_KEY,
  PROGRESS_HOLD_MS,
  SETTLE_CAP_MS,
  buildBootScript,
  colorToHex,
  renderProgress,
  shouldPlayIntro,
  type BootContext,
  type IntroStage,
  type ProgressState,
} from "./intro";
import {
  TERMINAL_ORANGE,
  log,
  markStreamed,
  reducedMotion,
  startStreaming,
} from "./navLog";
import { PERF_ATTRIBUTE } from "./perf";
import { getTier, initPerf } from "./perfStore";
import { safeGet, safeSet, sessionStore } from "./storage";
import { flushTyping, typingDuration, typingIdle } from "./typingQueue";

let stage: IntroStage = "idle";

let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export const getStage = (): IntroStage => stage;
/** The server, and the first client render, never show the intro. */
export const getServerStage = (): IntroStage => "idle";

function setStage(next: IntroStage) {
  stage = next;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (next === "idle") root.removeAttribute(INTRO_ATTRIBUTE);
    else root.setAttribute(INTRO_ATTRIBUTE, next);
  }
  emit();
}

// --- Status bar ---

export interface IntroProgress extends ProgressState {
  /** The finished bar has been written into the log; the live one is gone. */
  logged: boolean;
}

let progress: IntroProgress = { done: 0, total: 0, label: "init", logged: false };

export const getProgress = (): IntroProgress => progress;

function setProgress(patch: Partial<IntroProgress>) {
  progress = { ...progress, ...patch };
  emit();
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const untilVisible = () =>
  new Promise<void>((resolve) => {
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });

/** The site accent on <html>: the playing album's color, else the default. */
function readAccent(): string {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue("--now-playing-accent")
    .trim();
  const transparent =
    !val || val === "transparent" || /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(val);
  return transparent ? TERMINAL_ORANGE : colorToHex(val);
}

function bootContext(): BootContext {
  const root = document.documentElement;
  return {
    theme: root.classList.contains("dark") ? "dark" : "light",
    perf: root.getAttribute(PERF_ATTRIBUTE) ?? "full",
    pathname: window.location.pathname,
    accent: readAccent(),
    now: new Date(),
  };
}

/** Keys that would scroll the page; everything else may keep its default. */
const SCROLL_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);
/** Pressing a modifier on its own is not "any key". */
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"]);

let started = false;

/**
 * Runs once per page load. Either plays the intro (and logs the full boot
 * script into the terminal as it goes) or logs the docked panel's usual
 * boot lines straight away.
 */
export async function startIntro() {
  if (started || typeof window === "undefined") return;
  started = true;

  initPerf();
  startStreaming();

  const root = document.documentElement;
  const play =
    root.getAttribute(INTRO_ATTRIBUTE) === "pending" &&
    shouldPlayIntro({
      alreadyPlayed: safeGet(sessionStore(), INTRO_SESSION_KEY) === "1",
      reducedMotion: reducedMotion(),
      perfTier: getTier(),
      pathname: window.location.pathname,
    });

  if (!play) {
    setStage("idle");
    for (const line of buildBootScript(bootContext(), "classic")) log(line.kind, line.text);
    return;
  }

  safeSet(sessionStore(), INTRO_SESSION_KEY, "1");
  // Timers are throttled in a background tab; wait so the boot isn't mangled.
  if (document.visibilityState === "hidden") await untilVisible();
  setStage("boot");

  let skipped = false;
  const skip = () => {
    if (skipped) return;
    skipped = true;
    flushTyping();
  };
  const onPointer = () => skip();
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || MODIFIER_KEYS.has(e.key)) return;
    if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    skip();
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") skip();
  };
  // No `overflow: hidden` on body: the scrollbar coming back would shift the
  // page the moment the intro ends.
  const block = (e: Event) => e.preventDefault();

  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("wheel", block, { passive: false });
  window.addEventListener("touchmove", block, { passive: false });

  const script = buildBootScript(bootContext(), "full");
  const loading = script.filter((line) => line.kind !== "done");
  setProgress({
    done: 0,
    total: loading.length,
    label: loading[0]?.status ?? "init",
    startedAt: 0,
    expectedMs: 0,
    logged: false,
  });

  for (const line of script) {
    if (line.kind === "done") {
      // Everything loaded: fill the bar, let the finish register, then
      // freeze it into the log where the live one was.
      setProgress({ done: progress.total });
      if (!skipped) await wait(PROGRESS_HOLD_MS);
      setProgress({ logged: true });
      markStreamed(log("progress", renderProgress(progress)).id);
    } else {
      // The bar creeps through this line over the time it should take to
      // type; a skipped line is over at once.
      setProgress({
        label: line.status ?? progress.label,
        startedAt: performance.now(),
        expectedMs: skipped ? 0 : typingDuration(line.text),
      });
    }

    const entry = log(line.kind, line.text);
    if (skipped) {
      markStreamed(entry.id);
    } else {
      // Let React mount the line (its effect enqueues the typing job), then
      // wait for the queue to drain. The cap guards against a stuck job.
      await wait(0);
      await Promise.race([typingIdle(), wait(SETTLE_CAP_MS)]);
    }
    if (line.kind !== "done") setProgress({ done: progress.done + 1 });
  }

  setStage("dock");
  await wait(DOCK_MS + 50);

  document.removeEventListener("pointerdown", onPointer, true);
  document.removeEventListener("keydown", onKey, true);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("wheel", block);
  window.removeEventListener("touchmove", block);

  setStage("idle");
}

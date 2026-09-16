/**
 * The boot intro: pure helpers and timing. The browser-side runner that
 * drives the stages is lib/introStore.ts; the panel that plays the part of
 * the boot screen is components/library/NavTerminal.tsx.
 *
 * On the first page of a session the nav terminal appears centered on a dark
 * screen, types a boot log, then flies to its usual bottom-left spot while
 * the site fades in underneath.
 */
import type { LogKind } from "./navLog";
import type { PerfTier } from "./perf";

export type IntroStage = "idle" | "boot" | "dock";

/** sessionStorage flag: the intro has played this session. */
export const INTRO_SESSION_KEY = "intro";
/**
 * `<html data-intro>`: "pending" from the pre-paint bootstrap in
 * pages/_document.tsx (backdrop up before hydration), then "boot" and "dock"
 * from the runner, then removed. CSS keys off it in styles/globals.css.
 */
export const INTRO_ATTRIBUTE = "data-intro";

/** The card's pop-in (styles/globals.css .intro-pop). */
export const INTRO_POP_MS = 250;
/** Card flight from center to the docked corner. */
export const DOCK_MS = 650;
export const DOCK_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";
/** Backdrop fade once docking starts (CSS only; documented here). */
export const SITE_FADE_MS = 600;

/**
 * The live status bar pinned under the log while it boots: a braille
 * spinner, the module currently printing, and a bar that fills a notch per
 * line, like npm or cargo. 28 cells so it stays on one line when docked.
 */
export const PROGRESS_CELLS = 28;
export const SPINNER_MS = 80;
export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
/** Held at 100% before READY prints, so the finish registers. */
export const PROGRESS_HOLD_MS = 300;

/** Every label the bar can show; it is padded to the longest. */
const STATUS_LABELS = [
  "init",
  "prefs",
  "components/library",
  "three.webgl",
  "gsap",
  "perf.tier",
  "now-playing",
  "cursor.target",
  "swr.cache",
  "clock",
  "done",
] as const;
type StatusLabel = (typeof STATUS_LABELS)[number];
export const STATUS_WIDTH = Math.max(...STATUS_LABELS.map((l) => l.length));

/**
 * `rgb(212, 160, 83)` to `#d4a053`, for printing a computed color in the
 * boot log. Anything else comes back unchanged.
 */
export function colorToHex(value: string): string {
  const m = value.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (!m) return value.trim();
  return `#${m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
}

/** Longest the runner waits on one line before moving on regardless. */
export const SETTLE_CAP_MS = 2000;

/**
 * Whether the intro plays this page load. Reduced motion and the "low"
 * effects tier skip it outright; "reduced" still plays. The admin pages are
 * a tool, not the site.
 */
export function shouldPlayIntro(o: {
  alreadyPlayed: boolean;
  reducedMotion: boolean;
  perfTier: PerfTier;
  pathname: string;
}): boolean {
  if (o.alreadyPlayed || o.reducedMotion || o.perfTier === "low") return false;
  return !o.pathname.startsWith("/admin");
}

export interface BootContext {
  theme: "dark" | "light";
  perf: string;
  pathname: string;
  /** The terminal's prompt color, as a hex string. */
  accent: string;
  now: Date;
}

export interface BootLine {
  kind: LogKind;
  text: string;
  /** What the status bar says is loading while this line prints. */
  status?: StatusLabel;
}

/**
 * The boot log. "classic" is the docked panel's usual four lines; "full" is
 * the intro's longer script, ending in READY. Everything before READY
 * counts toward the status bar.
 */
export function buildBootScript(ctx: BootContext, mode: "classic" | "full"): BootLine[] {
  const loading: BootLine = { kind: "boot", text: "Loading ismaelbarajas.dev v2.0", status: "init" };
  const prefs: BootLine = {
    kind: "boot",
    text: `Setting preferences... theme=${ctx.theme} effects=${ctx.perf}`,
    status: "prefs",
  };
  const date: BootLine = {
    kind: "boot",
    text: `Current date: ${ctx.now.toLocaleDateString()}`,
    status: "clock",
  };
  const ready: BootLine = {
    // The docked panel's READY has always been a plain boot line; the intro
    // ends on a green one.
    kind: mode === "classic" ? "boot" : "done",
    text: `READY AT ${ctx.pathname}`,
  };

  if (mode === "classic") return [loading, prefs, date, ready];

  const sys = (text: string, status: StatusLabel): BootLine => ({ kind: "sys", text, status });
  return [
    loading,
    prefs,
    date,
    sys("mount  components/library ......  42 modules", "components/library"),
    sys("link   three.webgl renderer ........  ok", "three.webgl"),
    sys("load   gsap + scrolltrigger ........  ok", "gsap"),
    sys(`init   perf tier probe ........  ${ctx.perf}`, "perf.tier"),
    sys(`fetch  now-playing accent ....  ${ctx.accent}`, "now-playing"),
    sys("mount  cursor.target ........  ok", "cursor.target"),
    sys("warm   swr cache ........  ok", "swr.cache"),
    ready,
  ];
}

/**
 * How far the boot has got: lines finished out of lines to load, plus when
 * the current line started and how long it should take, so the bar can
 * creep through the line instead of jumping when it ends.
 */
export interface ProgressState {
  done: number;
  total: number;
  label: string;
  /** performance.now() when the current line began; 0 when unknown. */
  startedAt?: number;
  /** Expected typing time of the current line in ms; 0 when unknown. */
  expectedMs?: number;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
/** Ease in and out within a line: slow to start, quick through the middle. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * The bar's fill at `now`, 0 to 1. Whole lines count fully; the line in
 * progress counts by how far along its typing should be. That makes a long
 * line a slow stretch of the bar and a short one a quick hop.
 */
export function progressValue(state: ProgressState, now = 0): number {
  if (state.total <= 0) return 1;
  if (state.done >= state.total) return 1;
  const expected = state.expectedMs ?? 0;
  const within = expected > 0 ? clamp01((now - (state.startedAt ?? 0)) / expected) : 0;
  return clamp01((state.done + smoothstep(within)) / state.total);
}


export interface ProgressParts {
  spinner: string;
  /** Padded to a constant width so the bar never jitters. */
  stage: string;
  filled: string;
  empty: string;
  /** Right-aligned, without the % sign. */
  percent: string;
  complete: boolean;
}

export interface ProgressOptions {
  /** Spinner frame; advances on its own clock. */
  frame?: number;
  /** performance.now(), for the fill within the current line. */
  now?: number;
  cells?: number;
}

/**
 * The pieces of the bar, so the panel can color them separately. The bar
 * is apt-style: hashes for the fill, dots for the rest, in brackets.
 * `⠹ three.webgl        [#########...................]  34%`
 */
export function progressParts(state: ProgressState, opts: ProgressOptions = {}): ProgressParts {
  const { frame = 0, now = 0, cells = PROGRESS_CELLS } = opts;
  const ratio = progressValue(state, now);
  const complete = ratio >= 1;
  const filled = complete ? cells : Math.round(ratio * cells);
  return {
    spinner: complete ? "✔" : SPINNER_FRAMES[Math.abs(frame) % SPINNER_FRAMES.length],
    stage: (complete ? "done" : state.label).padEnd(STATUS_WIDTH, " "),
    filled: "#".repeat(filled),
    empty: ".".repeat(cells - filled),
    percent: String(Math.round(ratio * 100)).padStart(3, " "),
    complete,
  };
}

/** The bar as plain text, for the log entry once loading is over. */
export function renderProgress(state: ProgressState, opts: ProgressOptions = {}): string {
  const p = progressParts(state, opts);
  return `${p.spinner} ${p.stage} [${p.filled}${p.empty}] ${p.percent}%`;
}

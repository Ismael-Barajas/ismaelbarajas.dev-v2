/**
 * The navigation terminal's store and its pure helpers.
 *
 * Same shape as lib/perfStore.ts: a module-level array, a listener list, and
 * `subscribe` so React can read it through useSyncExternalStore. Every append
 * makes a new array so snapshots are referentially fresh and the panel
 * re-renders; the array is capped so a long session can't grow without bound.
 *
 * The `describe*` helpers are pure and live here rather than in the component
 * so the interesting branches are unit tested (__tests__/navLog.test.ts).
 */
import { localStore, safeGet, safeSet } from "./storage";

export type LogKind =
  | "boot"
  | "nav"
  | "done"
  | "jump"
  | "ext"
  | "pref"
  | "music"
  | "error";

export interface LogEntry {
  id: number;
  /** Epoch ms; formatted at render time by formatTime. */
  time: number;
  kind: LogKind;
  text: string;
}

/** The console orange shared with components/library/ConsoleGreeting.tsx. */
export const TERMINAL_ORANGE = "#ff7a18";

/** Stable server snapshot, and the initial client value, so hydration agrees. */
export const EMPTY: readonly LogEntry[] = [];

/** Oldest lines fall off the top past this. */
export const MAX_ENTRIES = 100;

/** localStorage key for the panel view: expanded, collapsed or hidden. */
export const TERMINAL_STORAGE_KEY = "terminal";
/** Below this width the panel defaults to collapsed. */
export const COLLAPSE_BREAKPOINT = 768;

let entries: readonly LogEntry[] = EMPTY;
let nextId = 1;

let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function log(kind: LogKind, text: string) {
  const entry: LogEntry = { id: nextId++, time: Date.now(), kind, text };
  const next = [...entries, entry];
  entries = next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
  emit();
}

export const getEntries = (): readonly LogEntry[] => entries;

/** Test-only reset; the app never clears the log. */
export function resetEntries() {
  entries = EMPTY;
  nextId = 1;
}

// --- Collapse preference ---

/**
 * Cached so the useSyncExternalStore snapshot doesn't hit localStorage on
 * every render. Only this module writes it, so the cache can't go stale.
 */
export type TerminalView = "expanded" | "collapsed" | "hidden";

const isTerminalView = (v: string | null): v is TerminalView =>
  v === "expanded" || v === "collapsed" || v === "hidden";

let view: TerminalView | null = null;

function readView(): TerminalView {
  const raw = safeGet(localStore(), TERMINAL_STORAGE_KEY);
  if (isTerminalView(raw)) return raw;
  const small = typeof window !== "undefined" && window.innerWidth <= COLLAPSE_BREAKPOINT;
  return small ? "collapsed" : "expanded";
}

export function getView(): TerminalView {
  if (view === null) view = readView();
  return view;
}

export function setView(next: TerminalView) {
  view = next;
  safeSet(localStore(), TERMINAL_STORAGE_KEY, next);
  emit();
}

// --- Pure helpers ---

/**
 * `11:44:44 PM`. Fixed to en-US so the log reads the same everywhere; the
 * panel renders it with tabular figures so the column doesn't jitter.
 */
export const formatTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

/**
 * What, if anything, a click on `href` should print.
 *
 * Same-origin navigations to another path return null: the router events
 * already log those, and logging here too would print every link twice.
 */
export function describeClick(
  href: string,
  currentUrl: string,
): { kind: LogKind; text: string } | null {
  const raw = href.trim();
  if (!raw) return null;

  let url: URL;
  let current: URL;
  try {
    current = new URL(currentUrl);
    url = new URL(raw, currentUrl);
  } catch {
    return null;
  }

  if (url.protocol === "javascript:") return null;
  if (url.protocol === "mailto:") {
    return { kind: "ext", text: `OPENING mailto:${url.pathname}` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "ext", text: `OPENING ${url.href}` };
  }

  if (url.origin !== current.origin) {
    const host = url.host.replace(/^www\./i, "");
    const path = url.pathname.replace(/\/+$/, "");
    return { kind: "ext", text: `OPENING ${host}${path}${url.search}` };
  }

  if (url.pathname !== current.pathname) return null;
  if (url.hash && url.hash !== "#") {
    return { kind: "jump", text: `JUMPING TO ${url.hash}` };
  }
  return null;
}

/** The slice of a now-playing sample the log cares about. */
export interface PlaybackSample {
  songUrl?: string;
  isPlaying: boolean;
  title?: string;
  artist?: string;
  type?: "track" | "episode";
}

/**
 * The line for a now-playing transition, or null when nothing changed.
 *
 * The poll repeats the same sample every few seconds, so "unchanged" has to
 * be the common case: only a different `songUrl` or a flipped `isPlaying`
 * ever prints. `prev` of null is the first sample after boot, where a
 * last-played fallback (not playing) is deliberately silent.
 */
export function describePlayback(
  prev: PlaybackSample | null | undefined,
  next: PlaybackSample | null | undefined,
): string | null {
  if (!next) return null; // no data yet, or the request failed

  const nextUrl = next.songUrl ?? "";
  const prevUrl = prev?.songUrl ?? "";
  if (prev && prevUrl === nextUrl && prev.isPlaying === next.isPlaying) return null;

  if (next.isPlaying) {
    return next.type === "episode"
      ? `NOW PLAYING ${next.title}`
      : `NOW PLAYING ${next.artist} — ${next.title}`;
  }

  if (!prev || !prev.isPlaying) return null;
  return prevUrl === nextUrl ? "PLAYBACK PAUSED" : "PLAYBACK STOPPED";
}

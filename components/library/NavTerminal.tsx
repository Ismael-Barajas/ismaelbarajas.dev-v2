import { useRouter } from "next/router";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavLog, useNavLogView, useNowPlaying, useNowPlayingAccent } from "hooks";
import {
  TERMINAL_ORANGE,
  describeClick,
  describePlayback,
  formatTime,
  getEntries,
  log,
  setView,
  type LogEntry,
  type LogKind,
  type PlaybackSample,
} from "lib/navLog";
import { PERF_ATTRIBUTE, PERF_LABELS, isPerfTier } from "lib/perf";

/**
 * A fixed terminal panel that narrates the visit: route changes, hash jumps,
 * outbound links, theme and effects changes, and what Spotify is playing.
 *
 * Everything is observed rather than reported: router events, a
 * capture-phase document click listener and a MutationObserver on <html>, so
 * no other component has to know this exists.
 */

/** Boot lines print once per page load, not once per StrictMode mount. */
let hasBooted = false;

/**
 * A plain `<a href="#x">` fires our click listener *and* the browser's
 * hashchange. Remembering the last click-logged hash for a moment keeps
 * those from printing two identical lines.
 */
let lastJump: { hash: string; at: number } | null = null;
const JUMP_DEDUPE_MS = 1000;

const KIND_COLOR: Partial<Record<LogKind, string>> = {
  // Muted but still legible through the glass over the light theme.
  boot: "#b8b2aa",
  done: "#3dd68c",
  error: "#f06060",
};

/** Per-character reveal, capped so long lines don't drag. */
const TYPE_MS_PER_CHAR = 14;
const TYPE_MAX_MS = 600;
/** Beat between one line finishing and the next starting. */
const LINE_GAP_MS = 90;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One line types at a time. Lines that land together (a click and the route
 * change it causes, the boot sequence) each wait for the previous line to
 * finish, so the log reads top to bottom instead of several lines racing.
 */
let typingQueue: Promise<void> = Promise.resolve();

/**
 * Reveals `text` a character at a time, like output streaming into a
 * terminal. Only lines that arrive after the panel is on screen animate;
 * anything already in the log (or a reduced-motion visitor) renders whole.
 * Returns `started: false` while the line is still waiting its turn.
 */
const useTyped = (text: string, animate: boolean, onTick: () => void) => {
  const [shown, setShown] = useState(animate ? 0 : text.length);
  const [started, setStarted] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    let finish = () => {};

    typingQueue = typingQueue.then(
      () =>
        new Promise<void>((resolve) => {
          if (cancelled) {
            resolve();
            return;
          }
          setStarted(true);
          const perChar = Math.min(TYPE_MS_PER_CHAR, TYPE_MAX_MS / Math.max(text.length, 1));
          let i = 0;
          let gap = 0;
          const id = window.setInterval(() => {
            i += 1;
            setShown(i);
            onTick();
            if (i >= text.length) {
              window.clearInterval(id);
              gap = window.setTimeout(resolve, LINE_GAP_MS);
            }
          }, perChar);
          // Unmounting mid-line (the panel collapsed) hands the turn on.
          finish = () => {
            window.clearInterval(id);
            window.clearTimeout(gap);
            resolve();
          };
        }),
    );

    return () => {
      cancelled = true;
      finish();
    };
  }, [animate, text, onTick]);

  return { visible: text.slice(0, shown), typing: shown < text.length, started };
};

/**
 * Lines with an id below this render whole: they were already in the log
 * when the panel first appeared. Set on mount; Infinity disables streaming.
 */
let animateFromId = Number.POSITIVE_INFINITY;
/**
 * Lines that have already streamed in once. Without this, expanding the
 * panel after a while would replay every line logged while it was closed.
 */
const streamed = new Set<number>();

interface LineProps {
  entry: LogEntry;
  promptColor: string;
  compact?: boolean;
  onTick: () => void;
}

const Line = ({ entry, promptColor, compact = false, onTick }: LineProps) => {
  // Decided once at mount so a later render can't restart the animation.
  const [animate] = useState(() => {
    const ok = !compact && entry.id >= animateFromId && !streamed.has(entry.id);
    if (ok) streamed.add(entry.id);
    return ok;
  });
  const { visible, typing, started } = useTyped(entry.text, animate, onTick);
  // Waiting its turn in the typing queue: keep the row out of the layout so
  // a lone timestamp isn't sitting there ahead of the line above it.
  if (!started) return null;
  return (
    <div className="flex gap-1.5">
      {entry.kind !== "boot" && (
        <span
          className="shrink-0 transition-colors duration-1000"
          style={{ color: promptColor, fontFeatureSettings: '"tnum" 1' }}
        >
          [{formatTime(entry.time)}]
        </span>
      )}
      <span
        className={`min-w-0 ${compact ? "truncate" : "break-words"} ${
          entry.kind === "music" ? "transition-colors duration-1000" : ""
        }`}
        style={
          entry.kind === "music"
            ? { color: promptColor }
            : { color: KIND_COLOR[entry.kind] }
        }
      >
        {visible}
        {typing && (
          <span aria-hidden="true" className="opacity-80" style={{ color: promptColor }}>
            ▍
          </span>
        )}
      </span>
    </div>
  );
};

const logJump = (hash: string, fromClick: boolean) => {
  const now = Date.now();
  if (!fromClick && lastJump && lastJump.hash === hash && now - lastJump.at < JUMP_DEDUPE_MS) {
    return;
  }
  lastJump = { hash, at: now };
  log("jump", `JUMPING TO ${hash}`);
};

const NavTerminal = () => {
  const router = useRouter();
  const entries = useNavLog();
  const view = useNavLogView();
  const collapsed = view === "collapsed";
  const accent = useNowPlayingAccent();
  const { data: nowPlaying } = useNowPlaying();
  const bodyId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastSample = useRef<PlaybackSample | null>(null);

  // Boot lines, router events, hash jumps and link clicks.
  useEffect(() => {
    const root = document.documentElement;

    // Anything logged from here on streams in; what's already there is
    // rendered whole. Reduced-motion visitors get every line whole.
    if (animateFromId === Number.POSITIVE_INFINITY && !reducedMotion()) {
      animateFromId = (getEntries().at(-1)?.id ?? 0) + 1;
    }

    if (!hasBooted) {
      hasBooted = true;
      const theme = root.classList.contains("dark") ? "dark" : "light";
      const perf = root.getAttribute(PERF_ATTRIBUTE) ?? "full";
      const bootLines = [
        "Loading ismaelbarajas.dev v2.0",
        `Setting preferences... theme=${theme} effects=${perf}`,
        `Current date: ${new Date().toLocaleDateString()}`,
        `READY AT ${window.location.pathname}`,
      ];
      // The typing queue in useTyped sequences these one after another.
      bootLines.forEach((text) => log("boot", text));
    }

    const onRouteStart = (url: string) => log("nav", `NAVIGATING TO ${url}`);
    const onRouteDone = () => log("done", "NAVIGATION COMPLETE");
    const onRouteError = (err: { cancelled?: boolean }) => {
      if (!err?.cancelled) log("error", "NAVIGATION FAILED");
    };
    const onHashStart = (url: string) => {
      const i = url.indexOf("#");
      if (i !== -1) logJump(url.slice(i), true);
    };
    // Covers the /listen tabs (they replaceState and dispatch this event) and
    // browser back/forward across hashes. The home-page section links use
    // pushState, which fires nothing, so they only reach the click listener.
    const onHashChange = () => logJump(window.location.hash || "#top", false);

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const described = describeClick(
        anchor.getAttribute("href") ?? "",
        window.location.href,
      );
      if (!described) return;
      if (described.kind === "jump") logJump(described.text.replace("JUMPING TO ", ""), true);
      else log(described.kind, described.text);
    };

    router.events.on("routeChangeStart", onRouteStart);
    router.events.on("routeChangeComplete", onRouteDone);
    router.events.on("routeChangeError", onRouteError);
    router.events.on("hashChangeStart", onHashStart);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);

    return () => {
      router.events.off("routeChangeStart", onRouteStart);
      router.events.off("routeChangeComplete", onRouteDone);
      router.events.off("routeChangeError", onRouteError);
      router.events.off("hashChangeStart", onHashStart);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
    };
  }, [router.events]);

  // Theme and effects changes, read straight off <html> so the toggles stay
  // unaware of the log. Records whose old value matches the new one are the
  // bootstrap re-applying what was already there, not a visitor choice.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "class") {
          const wasDark = /(?:^|\s)dark(?:\s|$)/.test(record.oldValue ?? "");
          const isDark = root.classList.contains("dark");
          if (wasDark !== isDark) {
            log("pref", `THEME SET TO ${isDark ? "DARK" : "LIGHT"}`);
          }
        } else if (record.attributeName === PERF_ATTRIBUTE) {
          const next = root.getAttribute(PERF_ATTRIBUTE);
          // oldValue null is initPerf setting the attribute for the first
          // time on a fresh visit; that isn't a change the visitor made.
          if (!next || record.oldValue === null || record.oldValue === next) continue;
          log("pref", `EFFECTS SET TO ${isPerfTier(next) ? PERF_LABELS[next] : next}`);
        }
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", PERF_ATTRIBUTE],
      attributeOldValue: true,
    });
    return () => observer.disconnect();
  }, []);

  // The shared SWR subscription hands us a fresh object every poll, so the
  // "did anything actually change" decision lives in describePlayback.
  useEffect(() => {
    if (!nowPlaying) return;
    const line = describePlayback(lastSample.current, nowPlaying);
    lastSample.current = {
      songUrl: nowPlaying.songUrl,
      isPlaying: nowPlaying.isPlaying,
    };
    if (line) log("music", line);
  }, [nowPlaying]);

  // Follow the newest line, including while it is still typing out.
  const scrollToEnd = useCallback(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(scrollToEnd, [entries.length, view, scrollToEnd]);

  // Lines logged while the panel is collapsed or hidden were never on
  // screen, so treat them as already streamed: reopening after a while shows
  // the log as it is instead of replaying everything that happened meanwhile.
  useEffect(() => {
    if (view === "expanded") return;
    for (const entry of entries) streamed.add(entry.id);
  }, [entries, view]);

  const promptColor = accent ?? TERMINAL_ORANGE;
  const latest = entries[entries.length - 1];

  const renderLine = (entry: LogEntry, compact = false) => (
    <Line
      key={entry.id}
      entry={entry}
      promptColor={promptColor}
      compact={compact}
      onTick={scrollToEnd}
    />
  );

  const headerButton =
    "cursor-pointer text-[#e6e2dc]/80 hover:text-[#e6e2dc] focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text";

  // The listeners above keep logging while hidden; only the panel is gone.
  // The TerminalToggle in the NavBar brings it back.
  if (view === "hidden") return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-lg bg-[#0e0e10]/60 font-mono text-[11px] leading-[1.45] text-[#e6e2dc] shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10 backdrop-blur-md">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setView(collapsed ? "expanded" : "collapsed")}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          className={`flex min-w-0 flex-1 items-center justify-between py-1.5 pl-2.5 pr-1.5 text-left ${headerButton}`}
        >
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="transition-colors duration-1000"
              style={{ color: promptColor }}
            >
              &gt;_
            </span>
            terminal
          </span>
          <span aria-hidden="true">{collapsed ? "[+]" : "[-]"}</span>
        </button>
        <button
          type="button"
          onClick={() => setView("hidden")}
          aria-label="Hide terminal"
          className={`py-1.5 pl-1.5 pr-2.5 ${headerButton}`}
        >
          <span aria-hidden="true">[x]</span>
        </button>
      </div>
      <div
        id={bodyId}
        ref={bodyRef}
        role="log"
        aria-live="off"
        aria-label="Navigation log"
        className={
          collapsed ? "px-2.5 pb-1.5" : "max-h-44 overflow-y-auto px-2.5 pb-2"
        }
      >
        {collapsed
          ? latest && renderLine(latest, true)
          : entries.map((entry) => renderLine(entry))}
      </div>
    </div>
  );
};

export default NavTerminal;

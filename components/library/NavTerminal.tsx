import { useRouter } from "next/router";
import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import {
  useIntroProgress,
  useIntroStage,
  useNavLog,
  useNavLogView,
  useNowPlaying,
  useNowPlayingAccent,
} from "hooks";
import { DOCK_EASE, DOCK_MS } from "lib/intro";
import {
  TERMINAL_ORANGE,
  describeClick,
  describePlayback,
  log,
  markStreamed,
  setView,
  startStreaming,
  type LogEntry,
  type PlaybackSample,
} from "lib/navLog";
import { PERF_ATTRIBUTE, PERF_LABELS, isPerfTier } from "lib/perf";
import Line, { StatusLine } from "./TerminalLine";

/**
 * A fixed terminal panel that narrates the visit: route changes, hash jumps,
 * outbound links, theme and effects changes, and what Spotify is playing.
 *
 * Everything is observed rather than reported: router events, a
 * capture-phase document click listener and a MutationObserver on <html>, so
 * no other component has to know this exists.
 *
 * On the first page of a session the same panel doubles as the boot screen
 * (lib/introStore.ts): it sits centered and enlarged while the boot log
 * types out, then flies to its corner as the site fades in behind it.
 */

/**
 * A plain `<a href="#x">` fires our click listener *and* the browser's
 * hashchange. Remembering the last click-logged hash for a moment keeps
 * those from printing two identical lines.
 */
let lastJump: { hash: string; at: number } | null = null;
const JUMP_DEDUPE_MS = 1000;

const LOOK =
  "overflow-hidden rounded-lg bg-[#0e0e10]/75 font-mono text-[11px] leading-[1.45] text-[#e6e2dc] shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10 backdrop-blur-md";
const DOCKED = "fixed bottom-4 left-4 w-[min(26rem,calc(100vw-2rem))]";
const STAGE_CLASS = {
  idle: `${DOCKED} z-30`,
  // Above the fading backdrop (z-60) until it lands.
  dock: `${DOCKED} z-[70]`,
  boot: "intro-pop fixed left-1/2 top-1/2 z-[70] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 md:scale-[1.15]",
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
  const storedView = useNavLogView();
  const stage = useIntroStage();
  const progress = useIntroProgress();
  const intro = stage !== "idle";
  // The boot screen is always the full log, whatever the visitor's setting.
  const view = intro ? "expanded" : storedView;
  const collapsed = view === "collapsed";
  const accent = useNowPlayingAccent();
  const { data: nowPlaying } = useNowPlaying();
  const bodyId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastSample = useRef<PlaybackSample | null>(null);
  /** Where the centered card was, for the flight to its corner. */
  const bootRect = useRef<{ rect: DOMRect; scale: number; bodyHeight: number } | null>(null);

  // Router events, hash jumps and link clicks. The boot lines themselves are
  // logged by lib/introStore.ts, which also owns the intro.
  useEffect(() => {
    // Anything logged from here on streams in; what's already there is
    // rendered whole. Reduced-motion visitors get every line whole.
    startStreaming();

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
    for (const entry of entries) markStreamed(entry.id);
  }, [entries, view]);

  // While booting, remember where the centered card is after every commit
  // (a line starting changes its height) and on resize. The dock effect
  // below flies it from there.
  useLayoutEffect(() => {
    if (stage !== "boot") return;
    const measure = () => {
      const el = rootRef.current;
      const body = bodyRef.current;
      if (!el || !body) return;
      const scale = parseFloat(getComputedStyle(el).scale) || 1;
      bootRect.current = {
        rect: el.getBoundingClientRect(),
        scale,
        bodyHeight: body.getBoundingClientRect().height / scale,
      };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  // Dock: FLIP from the remembered centered rect to the docked layout React
  // has just committed. Width and height animate as real sizes (a
  // non-uniform scale would stretch the text); the card's overflow-hidden
  // clips the log while it shrinks. The log body shrinks in step and stays
  // scrolled to its last line the whole way, so READY never drops out of
  // view mid-flight. Cleanup on idle clears the inline styles.
  useLayoutEffect(() => {
    if (stage !== "dock") return;
    const el = rootRef.current;
    const body = bodyRef.current;
    const first = bootRect.current;
    if (!el || !body) return;
    let raf = 0;

    if (storedView === "hidden") {
      // Nowhere to land: fade out instead, and the idle render returns null.
      el.style.transition = `opacity ${DOCK_MS}ms ease`;
      el.style.opacity = "0";
    } else if (first) {
      const s = first.scale;
      const last = el.getBoundingClientRect();
      const lastBody = body.getBoundingClientRect().height;
      el.style.transition = "none";
      body.style.transition = "none";
      el.style.transformOrigin = "top left";
      el.style.width = `${first.rect.width / s}px`;
      el.style.height = `${first.rect.height / s}px`;
      body.style.maxHeight = `${first.bodyHeight}px`;
      // Measured after sizing: the docked card is bottom-anchored, so a
      // taller start box sits higher than the final one.
      const start = el.getBoundingClientRect();
      el.style.transform = `translate(${first.rect.left - start.left}px, ${first.rect.top - start.top}px) scale(${s})`;
      void el.offsetWidth;
      el.style.transition = ["transform", "width", "height"]
        .map((p) => `${p} ${DOCK_MS}ms ${DOCK_EASE}`)
        .join(", ");
      body.style.transition = `max-height ${DOCK_MS}ms ${DOCK_EASE}`;
      el.style.width = `${last.width}px`;
      el.style.height = `${last.height}px`;
      el.style.transform = "translate(0px, 0px) scale(1)";
      body.style.maxHeight = `${lastBody}px`;

      // The body shrinks from the bottom, so keep it pinned to the end.
      const follow = () => {
        scrollToEnd();
        raf = window.requestAnimationFrame(follow);
      };
      follow();
    }

    return () => {
      window.cancelAnimationFrame(raf);
      el.style.cssText = "";
      body.style.cssText = "";
      scrollToEnd();
    };
  }, [stage, storedView, scrollToEnd]);

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
    <div
      ref={rootRef}
      // A skip click during the intro must not land on the header buttons.
      inert={intro}
      className={`${STAGE_CLASS[stage]} ${LOOK}`}
    >
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
          collapsed
            ? "px-2.5 pb-1.5"
            : `overflow-y-auto px-2.5 pb-2 ${stage === "boot" ? "max-h-[60vh]" : "max-h-44"}`
        }
      >
        {collapsed
          ? latest && renderLine(latest, true)
          : entries.map((entry) => renderLine(entry))}
        {intro && !progress.logged && <StatusLine state={progress} accent={promptColor} />}
      </div>
    </div>
  );
};

export default NavTerminal;

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  useIntroProgress,
  useIntroStage,
  useNavLog,
  useNavLogPeek,
  useNavLogView,
  useNavObservers,
  useNowPlayingAccent,
} from "hooks";
import { DOCK_EASE, DOCK_MS } from "lib/intro";
import { getStage } from "lib/introStore";
import {
  PEEK_HOLD_MS,
  TERMINAL_INSET_PROPERTY,
  TERMINAL_ORANGE,
  endPeek,
  fitsBesideContent,
  getView,
  markStreamed,
  peek,
  reducedMotion,
  setView,
  type LogEntry,
} from "lib/navLog";
import { typingIdle } from "lib/typingQueue";
import TerminalInput from "./TerminalInput";
import Line, { StatusLine } from "./TerminalLine";

/**
 * A fixed terminal panel that narrates the visit: route changes, hash jumps,
 * outbound links, theme and effects changes, and what Spotify is playing.
 *
 * Everything is observed rather than reported (hooks/useNavObservers.tsx),
 * so no other component has to know this exists. Under the log sits a
 * prompt (TerminalInput.tsx): `help` lists what it understands, and the
 * backtick key focuses it from anywhere on the page.
 *
 * On the first page of a session the same panel doubles as the boot screen
 * (lib/introStore.ts): it sits centered and enlarged while the boot log
 * types out, then flies to its corner as the site fades in behind it.
 *
 * Collapsed, the panel is a one-line strip that peeks open whenever a line
 * lands and folds back up once the line has typed and sat for a moment
 * (lib/navLog.ts `isPeeking`). That is the default wherever the docked
 * panel would otherwise sit over the page content. Left alone for a few
 * seconds the panel fades back until it is pointed at, focused, or has
 * something new to say.
 */

const LOOK =
  "overflow-hidden rounded-lg bg-[#0e0e10]/75 font-mono text-[11px] leading-[1.45] text-[#e6e2dc] shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10 backdrop-blur-md";
/**
 * Full width only where the panel has a gutter to sit in; narrower where
 * it shares the viewport with the content (1080p and below). 2352px is the
 * viewport at which lib/navLog.ts fitsBesideContent first holds.
 */
const DOCKED = "fixed bottom-4 left-4 w-[min(22rem,calc(100vw-2rem))] min-[2352px]:w-[26rem]";
/** The docked panel's bottom-4 offset, for the page inset. */
const DOCK_OFFSET_PX = 16;
const STAGE_CLASS = {
  idle: `${DOCKED} z-30`,
  // Above the fading backdrop (z-60) until it lands.
  dock: `${DOCKED} z-[70]`,
  // 30rem holds the status bar's ~56 monospace cells with little to spare.
  boot: "intro-pop fixed left-1/2 top-1/2 z-[70] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 md:scale-[1.15]",
};

/** Idle this long with nothing new, and the panel fades back. */
const DIM_MS = 3000;

/** The header's "booting" caption: the boot lines' muted gray (TerminalLine.tsx). */
const BOOT_LABEL_COLOR = "#b8b2aa";

/** The fold between the full log and the one-line strip. */
const FOLD_MS = 420;
const FOLD_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
/** Height of the strip: one text-[11px] leading-[1.45] line plus pb-2. */
const STRIP_PX = 11 * 1.45 + 8;

/**
 * What the log body is showing. The list stays rendered while folding so
 * the log visibly closes over its last line instead of vanishing, and is
 * back before the body grows again.
 */
type Phase = "open" | "folding" | "strip" | "unfolding";

/** The key that focuses the prompt from anywhere on the page. */
const FOCUS_KEY = "`";

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

const NavTerminal = () => {
  const entries = useNavLog();
  const storedView = useNavLogView();
  const peeking = useNavLogPeek();
  const stage = useIntroStage();
  const progress = useIntroProgress();
  const intro = stage !== "idle";
  // The boot screen is always the full log, whatever the visitor's setting.
  const view = intro ? "expanded" : storedView;
  const collapsed = view === "collapsed" && !peeking;
  const [phase, setPhase] = useState<Phase>(collapsed ? "strip" : "open");
  // A change of `collapsed` starts a fold or unfold (set during render, so
  // the same commit renders the right list). Reduced motion jumps.
  const [wasCollapsed, setWasCollapsed] = useState(collapsed);
  if (wasCollapsed !== collapsed) {
    setWasCollapsed(collapsed);
    const jump = reducedMotion();
    setPhase(collapsed ? (jump ? "strip" : "folding") : jump ? "open" : "unfolding");
  }
  // Pointer or focus inside the panel: a peek waits for it to leave, and
  // the panel doesn't dim. Two flags rather than one because React can
  // remove the focused input (hide, fold) without the browser firing blur.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const held = hovered || focused;
  // Hiding the panel removes the focused element without a blur event (and
  // the pointer with it), so both flags reset here, in render like `phase`.
  const hidden = view === "hidden";
  const [wasHidden, setWasHidden] = useState(hidden);
  if (wasHidden !== hidden) {
    setWasHidden(hidden);
    if (hidden) {
      setHovered(false);
      setFocused(false);
    }
  }
  // Fading back: the panel is dimmed once DIM_MS has passed with no new
  // line and no visitor on it. `activity` names the moment the wait began,
  // so a new line makes the panel opaque in the same render, and the
  // timer that reaches `activity` is the one that dims it.
  const activity = `${entries.length}:${peeking}:${intro}`;
  const [idleSince, setIdleSince] = useState<string | null>(null);
  const dimmed = !held && !intro && !peeking && idleSince === activity;
  useEffect(() => {
    if (held || intro || peeking || idleSince === activity) return;
    const timer = window.setTimeout(() => setIdleSince(activity), DIM_MS);
    return () => window.clearTimeout(timer);
  }, [held, intro, peeking, idleSince, activity]);
  const wake = () => setIdleSince(null);
  const accent = useNowPlayingAccent();
  const bodyId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Bumped by the focus key; the prompt takes focus once it is on screen. */
  const [focusRequest, setFocusRequest] = useState(0);
  /** Where the centered card was, for the flight to its corner. */
  const bootRect = useRef<{ rect: DOMRect; scale: number; bodyHeight: number } | null>(null);

  useNavObservers(intro);

  // The focus key: outside any other text field, and never during the
  // intro (whose own listener treats any key as a skip), it puts the caret
  // in the prompt. A hidden panel comes back; a folded one peeks open and
  // folds again once the prompt loses focus, so the visitor's collapse
  // choice stands. The prompt only exists once the unfold lands, hence the
  // request counter below.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== FOCUS_KEY || e.ctrlKey || e.metaKey || e.altKey) return;
      if (getStage() !== "idle" || isEditable(e.target)) return;
      e.preventDefault();
      if (getView() === "hidden") setView("expanded");
      else peek();
      setFocusRequest((n) => n + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (focusRequest && phase === "open") inputRef.current?.focus();
  }, [focusRequest, phase]);

  // A peek ends once its newest line has finished typing and sat for a
  // beat, unless the visitor is hovering or has focus inside the panel. It
  // never ends mid-intro: the boot log lands in its corner open and folds
  // up from there.
  useEffect(() => {
    if (!peeking || intro || held) return;
    let cancelled = false;
    let timer = 0;
    void typingIdle().then(() => {
      if (cancelled) return;
      timer = window.setTimeout(endPeek, PEEK_HOLD_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [peeking, intro, held, entries.length]);

  // Follow the newest line, including while it is still typing out.
  const scrollToEnd = useCallback(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(scrollToEnd, [entries.length, phase, scrollToEnd]);

  // Lines logged while the panel is collapsed or hidden were never on
  // screen, so treat them as already streamed: reopening after a while shows
  // the log as it is instead of replaying everything that happened meanwhile.
  useEffect(() => {
    if (view === "expanded" || peeking) return;
    for (const entry of entries) markStreamed(entry.id);
  }, [entries, view, peeking]);

  // Keep the page bottom clear of the panel wherever it sits over the
  // content column (a phone, 1080p), so the footer can scroll out from
  // under it. Only the resting height is published, so peeks and folds
  // don't move the page; the value lands on <html> for Layout to read.
  const resting = !intro && !peeking && (phase === "open" || phase === "strip");
  useEffect(() => {
    const root = document.documentElement;
    const el = rootRef.current;
    if (view === "hidden" || !el) {
      root.style.removeProperty(TERMINAL_INSET_PROPERTY);
      return;
    }
    if (!resting) return;
    const publish = () => {
      const covers = !fitsBesideContent(window.innerWidth);
      const height = Math.round(el.getBoundingClientRect().height);
      root.style.setProperty(
        TERMINAL_INSET_PROPERTY,
        covers ? `${height + DOCK_OFFSET_PX}px` : "0px",
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, [view, resting]);

  // The fold itself. Height animates as a real size (a max-height tween
  // stalls while the log is shorter than its cap) and the body stays
  // pinned to its last line, so the log closes over it and opens from it.
  // Cleanup clears the inline styles; the phase after the fold renders the
  // strip or the open list at its natural height.
  useLayoutEffect(() => {
    if (phase !== "folding" && phase !== "unfolding") return;
    const body = bodyRef.current;
    if (!body) return;
    const folding = phase === "folding";
    const from = folding ? body.getBoundingClientRect().height : STRIP_PX;
    const to = folding ? STRIP_PX : body.getBoundingClientRect().height;
    body.style.transition = "none";
    body.style.overflow = "hidden";
    body.style.height = `${from}px`;
    void body.offsetHeight;
    body.style.transition = `height ${FOLD_MS}ms ${FOLD_EASE}`;
    body.style.height = `${to}px`;

    let raf = 0;
    const follow = () => {
      scrollToEnd();
      raf = window.requestAnimationFrame(follow);
    };
    follow();
    const timer = window.setTimeout(() => setPhase(folding ? "strip" : "open"), FOLD_MS);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      body.style.cssText = "";
      scrollToEnd();
    };
  }, [phase, scrollToEnd]);

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
  /** Hidden until the panel is hovered or holds focus; always shown to a keyboard on the control. */
  const revealed =
    "opacity-0 transition-opacity duration-200 group-hover/panel:opacity-100 group-focus-within/panel:opacity-100";

  // The listeners above keep logging while hidden; only the panel is gone.
  // The TerminalToggle in the NavBar brings it back.
  if (view === "hidden") return null;

  return (
    <div
      ref={rootRef}
      // A skip click during the intro must not land on the header buttons.
      inert={intro}
      // `group/panel`: the header controls show only while the pointer is
      // over the panel or something inside it has focus.
      className={`group/panel ${STAGE_CLASS[stage]} ${LOOK} transition-opacity ${
        dimmed ? "opacity-40 duration-700" : "duration-200"
      } motion-reduce:transition-none`}
      onPointerEnter={() => {
        setHovered(true);
        wake();
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        wake();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => {
            if (collapsed) setView("expanded");
            else if (peeking) endPeek();
            else setView("collapsed");
          }}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? "Expand terminal" : "Collapse terminal"}
          className={`flex min-w-0 flex-1 items-center justify-between py-1.5 pl-2.5 text-left ${
            intro ? "pr-2.5" : "pr-1.5"
          } ${headerButton}`}
        >
          <span
            aria-hidden="true"
            className="transition-colors duration-1000"
            style={{ color: promptColor }}
          >
            &gt;_
          </span>
          {/* The controls are inert mid-intro; the row says what the card is
              doing instead. Keyed apart so React swaps the node rather than
              restyling the caption's, which would fade "[-]" out from
              opacity 1 as the card lands. */}
          {intro ? (
            <span key="caption" aria-hidden="true" style={{ color: BOOT_LABEL_COLOR }}>
              booting
            </span>
          ) : (
            <span key="toggle" aria-hidden="true" className={revealed}>
              {collapsed ? "[+]" : "[-]"}
            </span>
          )}
        </button>
        {/* Not during the intro: the caption is flush right and nothing is clickable. */}
        {!intro && (
          <button
            type="button"
            onClick={() => setView("hidden")}
            aria-label="Hide terminal"
            className={`py-1.5 pl-1.5 pr-2.5 ${headerButton} ${revealed}`}
          >
            <span aria-hidden="true">[x]</span>
          </button>
        )}
      </div>
      <div
        id={bodyId}
        ref={bodyRef}
        role="log"
        aria-live="off"
        aria-label="Navigation log"
        className={
          phase === "strip"
            ? "px-2.5 pb-2"
            : `overflow-y-auto px-2.5 pb-2 ${stage === "boot" ? "max-h-[60vh]" : "max-h-44"}`
        }
        // A click on the log puts the caret in the prompt, unless the
        // visitor is selecting text to copy.
        onClick={() => {
          if (phase !== "open" || intro || window.getSelection()?.toString()) return;
          inputRef.current?.focus();
        }}
      >
        {phase === "strip"
          ? latest && renderLine(latest, true)
          : entries.map((entry) => renderLine(entry))}
        {intro && !progress.logged && <StatusLine state={progress} accent={promptColor} />}
        {/* Kept through a fold so the fold measures the body with it in. */}
        {phase !== "strip" && !intro && (
          <TerminalInput
            promptColor={promptColor}
            inputRef={inputRef}
            onTick={scrollToEnd}
            onActivity={wake}
          />
        )}
      </div>
    </div>
  );
};

export default NavTerminal;

import { useRouter, type NextRouter } from "next/router";
import {
  version as reactVersion,
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { useActiveSection, useNowPlaying } from "hooks";
import { setTheme } from "hooks/useTheme";
import {
  complete,
  formatLocation,
  formatPrompt,
  parseLocation,
  run,
  scrollSections,
  type CommandContext,
  type Effect,
  type Location,
} from "lib/commands";
import { colorToHex } from "lib/intro";
import { clearEntries, describeClick, log, setView, type PlaybackSample } from "lib/navLog";
import { getPreference, getTier, setPreference } from "lib/perfStore";
import { CURSOR_GLYPH } from "./TerminalLine";

/**
 * The terminal's prompt: a line the visitor can type into, under the log.
 * What a line does is decided by lib/commands.ts (pure); this component
 * echoes it, prints the result and applies the one effect it asked for.
 * The echo and the output print whole, like a real shell; the lines a
 * command causes (NAVIGATING TO, THEME SET TO) still type out, because the
 * observers in hooks/useNavObservers.tsx log those as they always have.
 */

/** Module-level so the history survives the panel hiding or folding. */
const history: string[] = [];
const HISTORY_MAX = 50;
const bootAt = typeof performance === "undefined" ? 0 : performance.now();

const readLocation = (): Location =>
  parseLocation(window.location.pathname, window.location.hash);

/**
 * Where the URL says the visitor is. Route changes come from the router;
 * hash changes from the browser, and from the site's own hash-setting code
 * (ListenTabs, NavBar's section links), which dispatches the event by hand
 * because pushState fires nothing.
 */
function useUrlLocation(): Location {
  const router = useRouter();
  const subscribe = useCallback(
    (cb: () => void) => {
      window.addEventListener("hashchange", cb);
      window.addEventListener("popstate", cb);
      router.events.on("routeChangeComplete", cb);
      router.events.on("hashChangeComplete", cb);
      return () => {
        window.removeEventListener("hashchange", cb);
        window.removeEventListener("popstate", cb);
        router.events.off("routeChangeComplete", cb);
        router.events.off("hashChangeComplete", cb);
      };
    },
    [router.events],
  );
  // A string snapshot, so an unchanged location is the same value.
  const key = useSyncExternalStore(subscribe, () => formatLocation(readLocation()), () => "/");
  const [pathname, hash = ""] = key.split("#");
  return parseLocation(pathname, hash);
}

/**
 * Where the visitor actually is. On a page whose sections are scroll
 * positions the hash only says where they last jumped, so the section comes
 * from the scroll instead, the same way the NavBar's underline follows it.
 */
function useLocation(): Location {
  const url = useUrlLocation();
  const scrolled = scrollSections(url.pathname);
  const section = useActiveSection(scrolled);
  return scrolled.length ? { pathname: url.pathname, hash: section } : url;
}

function readContext(
  location: Location,
  accent: string,
  nowPlaying: PlaybackSample | null,
): CommandContext {
  const root = document.documentElement;
  const next = (window as { next?: { version?: string } }).next?.version;
  return {
    location,
    theme: root.classList.contains("dark") ? "dark" : "light",
    effects: { preference: getPreference(), tier: getTier() },
    nowPlaying,
    // A playing album's accent arrives as rgb(); the log prints hex.
    accent: colorToHex(accent),
    uptimeMs: performance.now() - bootAt,
    now: new Date(),
    versions: { next: next ?? "?", react: reactVersion },
  };
}

export function applyEffect(effect: Effect, router: NextRouter) {
  switch (effect.type) {
    case "navigate": {
      const { to } = effect;
      const here = parseLocation(window.location.pathname, "").pathname;
      void router
        .push(to.hash ? { pathname: to.pathname, hash: to.hash } : { pathname: to.pathname })
        .then(() => {
          // A hash-only push is a pushState, which fires no hashchange; the
          // /listen tabs (and the log's JUMPING TO line) listen for one.
          if (here === to.pathname) window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
      return;
    }
    case "back":
      router.back();
      return;
    case "clear":
      clearEntries();
      return;
    case "theme":
      setTheme(effect.value);
      return;
    case "effects":
      setPreference(effect.value);
      return;
    case "open":
      if (effect.url.startsWith("mailto:")) window.location.href = effect.url;
      else window.open(effect.url, "_blank", "noopener");
      return;
    case "exit":
      setView("hidden");
      return;
  }
}

interface Props {
  promptColor: string;
  inputRef: RefObject<HTMLInputElement | null>;
  /** After printing, so the panel keeps the prompt in view. */
  onTick: () => void;
  /** Any keystroke: the panel counts it as activity. */
  onActivity: () => void;
}

const TerminalInput = ({ promptColor, inputRef, onTick, onActivity }: Props) => {
  const router = useRouter();
  const { data: nowPlaying } = useNowPlaying();
  const location = useLocation();
  const prompt = formatPrompt(location);
  const id = useId();
  const [value, setValue] = useState("");
  /** Where the block cursor sits, in characters. */
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  /** Index into `history` while browsing it; `history.length` is the draft. */
  const [cursor, setCursor] = useState(history.length);
  const [draft, setDraft] = useState("");

  const set = (next: string) => {
    setValue(next);
    setCaret(next.length);
  };

  const syncCaret = (e: SyntheticEvent<HTMLInputElement>) => {
    setCaret(e.currentTarget.selectionStart ?? e.currentTarget.value.length);
  };

  const submit = () => {
    const line = value.trim();
    set("");
    setDraft("");
    if (line && history[history.length - 1] !== line) {
      history.push(line);
      if (history.length > HISTORY_MAX) history.shift();
    }
    setCursor(history.length);

    log("cmd", line, { instant: true, prompt });
    const result = run(line, readContext(location, promptColor, nowPlaying ?? null));
    for (const l of result.lines) log(l.kind, l.text, { instant: true });
    if (result.effect) {
      if (result.effect.type === "open") {
        const described = describeClick(result.effect.url, window.location.href);
        if (described) log(described.kind, described.text, { instant: true });
      }
      applyEffect(result.effect, router);
    }
    onTick();
  };

  const browse = (dir: -1 | 1) => {
    const at = Math.min(cursor, history.length);
    const next = Math.min(Math.max(at + dir, 0), history.length);
    if (next === at) return;
    if (at === history.length) setDraft(value);
    setCursor(next);
    set(next === history.length ? draft : history[next]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onActivity();
    const input = e.currentTarget;
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      browse(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      browse(1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const { completed, matches } = complete(value, location);
      if (completed !== undefined) set(completed);
      if (matches.length > 1) {
        log("out", matches.join("  "), { instant: true });
        onTick();
      }
    } else if (e.key === "Escape") {
      input.blur();
    } else if (e.key === "l" && e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      clearEntries();
    } else if (e.key === "c" && e.ctrlKey && !e.metaKey && !e.altKey) {
      // With a selection, Ctrl+C is copy.
      if (input.selectionStart !== input.selectionEnd) return;
      e.preventDefault();
      log("cmd", `${value}^C`, { instant: true, prompt });
      set("");
      setDraft("");
      setCursor(history.length);
      onTick();
    }
  };

  return (
    <div className="flex gap-1.5">
      <label
        htmlFor={id}
        aria-hidden="true"
        className="shrink-0 transition-colors duration-1000"
        style={{ color: promptColor }}
      >
        {prompt}
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            syncCaret(e);
          }}
          onSelect={syncCaret}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="send"
          aria-label="Terminal command"
          className="block w-full border-0 bg-transparent p-0 text-inherit outline-none"
          style={{ caretColor: "transparent" }}
        />
        {/* Only while focused, like a native caret. Remounting on every
            change restarts the blink, so it holds steady while typing and
            only blinks once the hand stops. */}
        {focused && (
          <span
            key={`${value}:${caret}`}
            aria-hidden="true"
            className="terminal-caret pointer-events-none absolute left-0 top-0 opacity-80"
            style={{ color: promptColor, transform: `translateX(${caret}ch)` }}
          >
            {CURSOR_GLYPH}
          </span>
        )}
      </div>
    </div>
  );
};

export default TerminalInput;

import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { getStage } from "lib/introStore";
import {
  describeClick,
  describePlayback,
  log,
  startStreaming,
  type PlaybackSample,
} from "lib/navLog";
import { PERF_ATTRIBUTE, PERF_LABELS, isPerfTier } from "lib/perf";
import useNowPlaying from "./useNowPlaying";

/**
 * The navigation terminal's ears: route changes, hash jumps, link clicks,
 * theme and effects changes, and what Spotify is playing, each logged into
 * lib/navLog.ts. Everything is observed rather than reported (router events,
 * a capture-phase click listener, a MutationObserver on <html>), so no other
 * component has to know the terminal exists. Mounted once, by NavTerminal.
 */

/**
 * A plain `<a href="#x">` fires our click listener *and* the browser's
 * hashchange. Remembering the last click-logged hash for a moment keeps
 * those from printing two identical lines.
 */
let lastJump: { hash: string; at: number } | null = null;
export const JUMP_DEDUPE_MS = 1000;

const logJump = (hash: string, fromClick: boolean) => {
  const now = Date.now();
  if (!fromClick && lastJump && lastJump.hash === hash && now - lastJump.at < JUMP_DEDUPE_MS) {
    return;
  }
  lastJump = { hash, at: now };
  log("jump", `JUMPING TO ${hash}`);
};

/** @param intro whether the boot intro is still running (music lines wait). */
export default function useNavObservers(intro: boolean) {
  const router = useRouter();
  const { data: nowPlaying } = useNowPlaying();
  const lastSample = useRef<PlaybackSample | null>(null);
  /** A now-playing line that arrived mid-boot, printed once the card lands. */
  const heldMusic = useRef<string | null>(null);

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
    // Covers the /listen tabs (they replaceState and dispatch this event),
    // browser back/forward across hashes, and the terminal's `cd` (which
    // dispatches it after a same-page push). The home-page section links use
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
  // During the boot intro the line waits its turn rather than cutting into
  // the boot script; only the latest one is kept.
  useEffect(() => {
    if (!nowPlaying) return;
    const line = describePlayback(lastSample.current, nowPlaying);
    lastSample.current = {
      songUrl: nowPlaying.songUrl,
      isPlaying: nowPlaying.isPlaying,
    };
    if (!line) return;
    if (getStage() !== "idle") heldMusic.current = line;
    else log("music", line);
  }, [nowPlaying]);

  useEffect(() => {
    if (intro || !heldMusic.current) return;
    log("music", heldMusic.current);
    heldMusic.current = null;
  }, [intro]);
}

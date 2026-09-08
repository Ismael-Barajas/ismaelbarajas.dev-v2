import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style"],
  });
  return () => observer.disconnect();
};

const getSnapshot = (): string | null => {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue("--now-playing-accent")
    .trim();
  const isTransparent =
    !val ||
    val === "transparent" ||
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(val);
  return isTransparent ? null : val;
};

const getServerSnapshot = () => null;

/**
 * The album accent color the Now Playing widget writes to the root element,
 * or null when nothing is actively playing.
 */
const useNowPlayingAccent = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useNowPlayingAccent;

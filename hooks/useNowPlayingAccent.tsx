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
 * The site accent as currently computed on the root element: the album
 * color the Now Playing widget writes there while a song plays, otherwise
 * the default set in styles/globals.css. Null only if the property is
 * somehow unset.
 */
const useNowPlayingAccent = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useNowPlayingAccent;

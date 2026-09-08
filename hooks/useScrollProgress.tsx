import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  window.addEventListener("resize", cb);
  return () => {
    window.removeEventListener("scroll", cb);
    window.removeEventListener("resize", cb);
  };
};

const getSnapshot = () => {
  const el = document.documentElement;
  const scrollable = el.scrollHeight - el.clientHeight;
  if (scrollable <= 0) return 0;
  return Math.min(100, Math.max(0, (100 * el.scrollTop) / scrollable));
};

const getServerSnapshot = () => 0;

/** Page scroll position as a 0-100 percentage. */
const useScrollProgress = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useScrollProgress;

import { useEffect, useState, type RefObject } from "react";

/**
 * Which of `ids` the visitor is looking at: the section whose box contains
 * the viewport's midpoint, or "" for none (the hero, the footer). Tracked
 * on scroll, the way the NavBar's underline always has been; the terminal's
 * prompt reads the same value, so the two never disagree.
 *
 * `lockUntil` (epoch ms) pauses tracking while a click-driven smooth scroll
 * passes through sections on its way somewhere.
 */
export default function useActiveSection(
  ids: readonly string[],
  lockUntil?: RefObject<number>,
): string {
  const [active, setActive] = useState("");
  // A string so a fresh array with the same ids doesn't resubscribe.
  const key = ids.join(" ");

  useEffect(() => {
    const sections = key ? key.split(" ") : [];
    const track = () => {
      if (lockUntil && Date.now() < lockUntil.current) return;
      const mid = window.innerHeight / 2;
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= mid && bottom >= mid) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", track, { passive: true });
    window.addEventListener("resize", track);
    // Sections move as images land and content mounts below the fold, with
    // no scroll event to say so; the body's height changing is the tell.
    const observer = new ResizeObserver(track);
    observer.observe(document.body);
    track();
    return () => {
      window.removeEventListener("scroll", track);
      window.removeEventListener("resize", track);
      observer.disconnect();
    };
  }, [key, lockUntil]);

  return active;
}

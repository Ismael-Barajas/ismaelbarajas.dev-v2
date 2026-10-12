import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  container?: Element | string | null;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  /**
   * Render in the final, visible state with no scroll reveal. Once true it
   * sticks for the component's lifetime, so turning it off again never hides
   * content that is already on screen.
   */
  immediate?: boolean;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  container,
  // Defaults are tuned so content resolves into place rather than pops: a
  // short travel, a slow soft ease, and a start point a little inside the
  // viewport so the whole transition is seen.
  distance = 12,
  direction = "vertical",
  reverse = false,
  duration = 0.9,
  ease = "power2.out",
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.15,
  delay = 0,
  immediate = false,
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // Latches on: adjusting state during render rather than in an effect, so
  // the first render with `immediate` is already visible.
  const [revealed, setRevealed] = useState(immediate);
  if (immediate && !revealed) setRevealed(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (revealed) {
      // Drop whatever a reveal that never ran (or was cut short) left inline:
      // the offset, the zero opacity, the visibility.
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform,opacity,visibility" });
      return;
    }

    // Respect reduced-motion and the low performance tier: show the content,
    // skip the animation.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-perf") === "low"
    ) {
      gsap.set(el, { visibility: "visible", opacity: 1 });
      return;
    }

    let scrollerTarget: Element | string | null =
      container !== undefined
        ? container
        : document.getElementById("snap-main-container") || null;

    if (typeof scrollerTarget === "string") {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const axis = direction === "horizontal" ? "x" : "y";
    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    gsap.set(el, {
      [axis]: offset,
      scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: "visible",
    });

    const tl = gsap.timeline({ paused: true, delay });

    tl.to(el, { [axis]: 0, scale: 1, opacity: 1, duration, ease });

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play(),
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, [
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    revealed,
  ]);

  return (
    <div
      ref={ref}
      className={revealed ? className : `invisible ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedContent;

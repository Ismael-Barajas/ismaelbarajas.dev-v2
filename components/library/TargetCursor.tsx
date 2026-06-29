import { useEffect, useRef, useCallback, useMemo } from "react";
import gsap from "gsap";

export interface TargetCursorProps {
  targetSelector?: string;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
}

const CORNER_SIZE = 10;
const BORDER_WIDTH = 2;
const LERP = 0.3;
// Cursor can drift this far outside the target's box before we let go. Keeps
// the active state stable around the edges and against moving targets.
const HIT_MARGIN = 6;

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = 'button, a, [role="button"]',
  hideDefaultCursor = true,
  hoverDuration = 0.2,
}) => {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isActiveRef = useRef(false);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hasTouchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  }, []);

  const moveCursor = useCallback((x: number, y: number) => {
    if (dotRef.current) {
      gsap.to(dotRef.current, { x, y, duration: 0.1, ease: "power3.out" });
    }
    if (ringRef.current && !isActiveRef.current) {
      gsap.to(ringRef.current, { x, y, duration: 0.18, ease: "power3.out" });
    }
  }, []);

  useEffect(() => {
    if (isMobile || !ringRef.current || !dotRef.current) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const corners = cornerRefs.current.filter(
      (c): c is HTMLDivElement => c !== null
    );

    const originalCursor = document.documentElement.style.cursor;
    if (hideDefaultCursor) {
      document.documentElement.style.cursor = "none";
    }

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, x: mouse.x, y: mouse.y });
    // Corners are top-left anchored and positioned in absolute screen
    // coordinates so they can lock onto a target's live bounding box.
    gsap.set(corners, { xPercent: 0, yPercent: 0, opacity: 0, x: mouse.x, y: mouse.y });

    // Each corner keeps its own smoothed screen position so it can chase a
    // moving target (e.g. magnetic buttons) without jitter.
    const cornerSetters = corners.map((corner) => ({
      x: gsap.quickSetter(corner, "x", "px"),
      y: gsap.quickSetter(corner, "y", "px"),
    }));
    const cornerPos = corners.map(() => ({ x: mouse.x, y: mouse.y }));

    let activeTarget: Element | null = null;

    const cornerTargets = (rect: DOMRect) => [
      { x: rect.left - BORDER_WIDTH, y: rect.top - BORDER_WIDTH },
      {
        x: rect.right + BORDER_WIDTH - CORNER_SIZE,
        y: rect.top - BORDER_WIDTH,
      },
      {
        x: rect.right + BORDER_WIDTH - CORNER_SIZE,
        y: rect.bottom + BORDER_WIDTH - CORNER_SIZE,
      },
      {
        x: rect.left - BORDER_WIDTH,
        y: rect.bottom + BORDER_WIDTH - CORNER_SIZE,
      },
    ];

    const activate = (target: Element) => {
      activeTarget = target;
      isActiveRef.current = true;
      // Break apart: corners start from the cursor; the resting circle fades.
      cornerPos.forEach((pos) => {
        pos.x = mouse.x;
        pos.y = mouse.y;
      });
      gsap.set(corners, { x: mouse.x, y: mouse.y });
      gsap.to(corners, { opacity: 1, duration: hoverDuration, overwrite: "auto" });
      gsap.to(ring, { opacity: 0, scale: 0.4, duration: hoverDuration, overwrite: "auto" });
    };

    const deactivate = () => {
      activeTarget = null;
      isActiveRef.current = false;
      // Come back together: corners fade out, circle fades back in.
      gsap.to(corners, { opacity: 0, duration: 0.25, overwrite: "auto" });
      gsap.to(ring, { opacity: 1, scale: 1, duration: 0.3, overwrite: "auto" });
    };

    // One ticker reads the target's live rect every frame, decides whether the
    // cursor is still on it (robust against the element moving under a still
    // cursor), and eases each corner toward it. No dependence on the cursor's
    // position for the corner math, so there is no feedback loop / vibration.
    const tickerFn = () => {
      if (!activeTarget) return;
      const rect = activeTarget.getBoundingClientRect();
      const stillOver =
        mouse.x >= rect.left - HIT_MARGIN &&
        mouse.x <= rect.right + HIT_MARGIN &&
        mouse.y >= rect.top - HIT_MARGIN &&
        mouse.y <= rect.bottom + HIT_MARGIN;
      if (!stillOver) {
        deactivate();
        return;
      }
      const targets = cornerTargets(rect);
      cornerPos.forEach((pos, i) => {
        pos.x += (targets[i].x - pos.x) * LERP;
        pos.y += (targets[i].y - pos.y) * LERP;
        cornerSetters[i].x(pos.x);
        cornerSetters[i].y(pos.y);
      });
    };
    gsap.ticker.add(tickerFn);

    const moveHandler = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      moveCursor(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", moveHandler);

    const mouseDownHandler = () => {
      gsap.to(dot, { scale: 0.7, duration: 0.3 });
      gsap.to(ring, { scale: 0.9, duration: 0.2 });
    };
    const mouseUpHandler = () => {
      gsap.to(dot, { scale: 1, duration: 0.3 });
      gsap.to(ring, { scale: 1, duration: 0.2 });
    };
    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    const enterHandler = (e: MouseEvent) => {
      let target: Element | null = null;
      let current: Element | null = e.target as Element;
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) {
          target = current;
          break;
        }
        current = current.parentElement;
      }
      if (!target || activeTarget === target) return;
      activate(target);
    };
    window.addEventListener("mouseover", enterHandler as EventListener);

    return () => {
      gsap.ticker.remove(tickerFn);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseover", enterHandler as EventListener);
      window.removeEventListener("mousedown", mouseDownHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      document.documentElement.style.cursor = originalCursor;
      isActiveRef.current = false;
    };
  }, [targetSelector, moveCursor, hideDefaultCursor, isMobile, hoverDuration]);

  if (isMobile) {
    return null;
  }

  const cornerBase =
    "fixed top-0 left-0 w-2.5 h-2.5 border-2 border-text dark:border-text pointer-events-none z-1000";
  const cornerStyles = [
    "border-r-0 border-b-0 rounded-tl-[4px]",
    "border-l-0 border-b-0 rounded-tr-[4px]",
    "border-l-0 border-t-0 rounded-br-[4px]",
    "border-r-0 border-t-0 rounded-bl-[4px]",
  ];

  return (
    <>
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-7 h-7 rounded-full border-2 border-text dark:border-text pointer-events-none z-1000"
        style={{ willChange: "transform, opacity" }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1 h-1 bg-text dark:bg-text rounded-full pointer-events-none z-1000"
        style={{ willChange: "transform" }}
      />
      {cornerStyles.map((style, i) => (
        <div
          key={i}
          ref={(el) => {
            cornerRefs.current[i] = el;
          }}
          className={`${cornerBase} ${style}`}
          style={{ willChange: "transform, opacity" }}
        />
      ))}
    </>
  );
};

export default TargetCursor;

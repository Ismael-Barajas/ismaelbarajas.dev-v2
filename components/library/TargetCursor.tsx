import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import usePerformanceTier from "hooks/usePerformanceTier";

export interface TargetCursorProps {
  targetSelector?: string;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  /** When true, the ring breaks into corners that lock onto hovered targets. */
  enableTargeting?: boolean;
}

const CORNER_SIZE = 10;
const BORDER_WIDTH = 2;
const LERP = 0.3;
// Cursor can drift this far outside the target's box before we let go. Keeps
// the active state stable around the edges and against moving targets.
const HIT_MARGIN = 6;

const subscribeNoop = () => () => {};
const getServerIsMobile = () => false;
let cachedIsMobile: boolean | null = null;
const detectMobile = (): boolean => {
  if (cachedIsMobile !== null) return cachedIsMobile;
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  // Primary input can't hover and is coarse: phones and tablets, including
  // an iPad in "desktop website" mode whose UA says Macintosh.
  const touchPrimary = window.matchMedia(
    "(hover: none) and (pointer: coarse)",
  ).matches;
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
  cachedIsMobile =
    touchPrimary || (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  return cachedIsMobile;
};

/** Class on <html> that hides the native cursor while the custom one is shown. */
const CURSOR_CLASS = "custom-cursor";

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = 'button, a, [role="button"]',
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  enableTargeting = false,
}) => {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isActiveRef = useRef(false);

  // Server snapshot is always "not mobile" so SSR and hydration agree; the
  // client snapshot then decides for real without a state-in-effect hop.
  const isTouch = useSyncExternalStore(
    subscribeNoop,
    detectMobile,
    getServerIsMobile,
  );
  // Low tier: native cursor (globals.css restores it) and no per-move tweens.
  const { tier } = usePerformanceTier();
  const isMobile = isTouch || tier === "low";

  // Shown only once a real mouse (or pen) has moved. Keeps the server HTML
  // from flashing the ring in the top-left corner before hydration, and
  // hides it again on hybrid devices when the visitor switches to touch.
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const setActiveState = useCallback((next: boolean) => {
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActive(next);
  }, []);

  useEffect(() => {
    if (isMobile || !active || !hideDefaultCursor) return;
    document.documentElement.classList.add(CURSOR_CLASS);
    return () => document.documentElement.classList.remove(CURSOR_CLASS);
  }, [active, isMobile, hideDefaultCursor]);

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

    // Reveal on mouse/pen input, hide on touch. pointerType is what tells a
    // hybrid laptop's trackpad apart from its touchscreen.
    const pointerHandler = (e: PointerEvent) => {
      setActiveState(e.pointerType !== "touch");
    };
    window.addEventListener("pointermove", pointerHandler, { passive: true });
    window.addEventListener("pointerdown", pointerHandler, { passive: true });

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
    if (enableTargeting) gsap.ticker.add(tickerFn);

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
    if (enableTargeting) {
      window.addEventListener("mouseover", enterHandler as EventListener);
    }

    return () => {
      gsap.ticker.remove(tickerFn);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseover", enterHandler as EventListener);
      window.removeEventListener("mousedown", mouseDownHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      window.removeEventListener("pointermove", pointerHandler);
      window.removeEventListener("pointerdown", pointerHandler);
      isActiveRef.current = false;
    };
  }, [
    targetSelector,
    moveCursor,
    setActiveState,
    isMobile,
    hoverDuration,
    enableTargeting,
  ]);

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

  // Hidden until a mouse moves. This is inline so it is in the server HTML
  // too: nothing to see at 0,0 on a phone, even if hydration is slow.
  const visibility = active ? "visible" : "hidden";

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-7 h-7 rounded-full border-2 border-text dark:border-text pointer-events-none z-1000"
        style={{ willChange: "transform, opacity", visibility }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-1 h-1 bg-text dark:bg-text rounded-full pointer-events-none z-1000"
        style={{ willChange: "transform", visibility }}
      />
      {cornerStyles.map((style, i) => (
        <div
          key={i}
          ref={(el) => {
            cornerRefs.current[i] = el;
          }}
          aria-hidden="true"
          className={`${cornerBase} ${style}`}
          style={{ willChange: "transform, opacity", visibility }}
        />
      ))}
    </>
  );
};

export default TargetCursor;

import { MutableRefObject, useEffect, useState } from "react";
import { useNowPlayingAccent, useScrollProgress } from "hooks";

interface Props {
  elementRef: MutableRefObject<null>;
}

const RING_RADIUS = 20;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Frosted back-to-top button, matching the nav's theme toggle. A thin ring
 * around it fills with scroll progress, tinted by the now-playing accent when
 * a song is on. Fades and rises in once the hero scrolls out of view.
 */
const BackToTop = ({ elementRef }: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const progress = useScrollProgress();
  const accent = useNowPlayingAccent();

  useEffect(() => {
    let observer: IntersectionObserver;
    const options = {
      threshold: 0.3,
    };
    if (elementRef.current) {
      observer = new IntersectionObserver((entries) => {
        entries[0].isIntersecting ? setIsVisible(false) : setIsVisible(true);
      }, options);
      observer.observe(elementRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  const scrollUp = () => {
    const startY = window.scrollY;
    if (startY === 0) return;
    let start: number | null = null;
    const duration = 600;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      window.scrollTo(0, startY * (1 - ease));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollUp}
      className={`group fixed bottom-4 right-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#E0E0E0]/70 text-text shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md transition-[opacity,translate,background-color] duration-500 ease-out hover:bg-[#E0E0E0]/90 dark:bg-[#141214]/70 dark:hover:bg-[#141214]/90 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.5"
        />
        <circle
          cx="22"
          cy="22"
          r={RING_RADIUS}
          fill="none"
          stroke={accent ?? "currentColor"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress / 100)}
          className="transition-[stroke-dashoffset,stroke] duration-150 ease-out"
        />
      </svg>
      <svg
        className="h-5 w-5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
};

export default BackToTop;

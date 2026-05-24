import { useEffect, useRef, useState } from "react";

interface Props {
  beforeMB?: number;
  afterMB?: number;
  durationMs?: number;
  className?: string;
}

const formatMB = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} GB`;
  return `${n.toFixed(n < 10 ? 1 : 0)} MB`;
};

const SizeTicker = ({
  beforeMB = 412,
  afterMB = 38,
  durationMs = 1800,
  className = "",
}: Props) => {
  const [value, setValue] = useState(beforeMB);
  const ref = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !playedRef.current) {
            playedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min((now - start) / durationMs, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(beforeMB + (afterMB - beforeMB) * eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [beforeMB, afterMB, durationMs]);

  const reductionPct = Math.max(
    0,
    Math.round(((beforeMB - afterMB) / beforeMB) * 100),
  );

  return (
    <div
      ref={ref}
      className={`c-mono c-tnum inline-flex items-center gap-3 ${className}`}
    >
      <span style={{ color: "var(--c-text-muted)" }}>
        {formatMB(beforeMB)}
      </span>
      <span style={{ color: "var(--c-accent)" }}>→</span>
      <span
        style={{ color: "var(--c-accent)", fontWeight: 600, fontSize: "1.05em" }}
      >
        {formatMB(value)}
      </span>
      <span
        className="c-pill c-pill-accent"
        aria-label={`${reductionPct} percent smaller`}
      >
        −{reductionPct}%
      </span>
    </div>
  );
};

export default SizeTicker;

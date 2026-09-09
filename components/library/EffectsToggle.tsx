import { useIsMounted } from "hooks";
import usePerformanceTier from "hooks/usePerformanceTier";
import { ToolTip } from "..";
import {
  AUTO_REASON_LABELS,
  PERF_LABELS,
  PERF_PREFERENCES,
  type PerfPreference,
  type PerfTier,
} from "lib/perf";
import type { ToggleStyle } from "./ThemeToggle";

const BUTTON: Record<ToggleStyle, string> = {
  ghost:
    "h-9 w-9 rounded-lg text-gray-500 hover:text-text dark:text-gray-400 dark:hover:text-text",
  frosted:
    "h-9 w-9 rounded-full bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]",
  classic: "h-9 w-9 rounded-lg bg-primary text-blue-100",
};

const next = (p: PerfPreference): PerfPreference => {
  const i = PERF_PREFERENCES.indexOf(p);
  return PERF_PREFERENCES[(i + 1) % PERF_PREFERENCES.length];
};

/** Feather-style bolt; one path so fill and outline swap without reflow. */
const BOLT = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";

/**
 * Lightning bolt whose treatment is the level: filled = Full, outline =
 * Reduced, struck through and dimmed = Minimal. In Auto mode a small "A"
 * badge marks that the level was chosen for the visitor rather than by them.
 */
const EffectsIcon = ({ tier, auto }: { tier: PerfTier; auto: boolean }) => {
  const filled = tier === "full";
  const off = tier === "low";
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      className="h-5 w-5 overflow-visible"
    >
      <path
        d={BOLT}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity={off ? 0.45 : 1}
        className="transition-[fill,opacity] duration-300"
      />
      {off && (
        <>
          {/* Knockout stroke so the slash reads over the bolt. */}
          <line
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            stroke="var(--background)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {auto && (
        <g>
          {/* Bottom-right: the only corner the bolt leaves empty. */}
          <circle cx="19" cy="19" r="5.5" fill="var(--background)" />
          <circle cx="19" cy="19" r="4.5" fill="currentColor" />
          <text
            x="19"
            y="21.6"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
            fill="var(--background)"
          >
            A
          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * Cycles the visual-effects level: Auto (detected) -> Full -> Reduced -> Minimal.
 * Lets anyone on a machine without GPU acceleration turn the shaders down,
 * and anyone who was auto-downgraded turn them back up.
 */
const EffectsToggle = ({ variant = "frosted" }: { variant?: ToggleStyle }) => {
  const { tier, preference, autoReason, setPreference } = usePerformanceTier();
  const isMounted = useIsMounted();
  const auto = preference === "auto";

  // e.g. "Effects: Auto, running Minimal (system reduce-motion setting)"
  const why = auto && AUTO_REASON_LABELS[autoReason];
  const label = auto
    ? `Effects: Auto, running ${PERF_LABELS[tier]}${why ? ` (${why})` : ""}`
    : `Effects: ${PERF_LABELS[preference]}`;
  const upcoming = PERF_LABELS[next(preference)];

  return (
    <ToolTip position="bottom" content={`${label} · click for ${upcoming}`}>
      <button
        type="button"
        aria-label={`${label}. Click to switch to ${upcoming}.`}
        data-preference={preference}
        data-tier={tier}
        className={`order-2 flex cursor-pointer items-center justify-center transition-colors duration-500 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text md:order-3 ${BUTTON[variant]}`}
        onClick={() => setPreference(next(preference))}
      >
        {isMounted.current && <EffectsIcon tier={tier} auto={auto} />}
      </button>
    </ToolTip>
  );
};

export default EffectsToggle;

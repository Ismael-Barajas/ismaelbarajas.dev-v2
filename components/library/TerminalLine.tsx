import { useEffect, useState } from "react";
import {
  PROGRESS_CELLS,
  SPINNER_MS,
  STATUS_WIDTH,
  progressParts,
  type ProgressParts,
  type ProgressState,
} from "lib/intro";
import { claimStream, formatTime, type LogEntry, type LogKind } from "lib/navLog";
import { LINE_GAP_MS, TYPE_MAX_MS, TYPE_MS_PER_CHAR, enqueue } from "lib/typingQueue";

/**
 * One line of the navigation terminal, streaming in like output arriving in
 * a real terminal. Which lines animate is decided by lib/navLog's streaming
 * state; the order they animate in by lib/typingQueue.
 */

const KIND_COLOR: Partial<Record<LogKind, string>> = {
  // Muted but still legible through the glass over the light theme.
  boot: "#b8b2aa",
  progress: "#b8b2aa",
  done: "#3dd68c",
  error: "#f06060",
};
/** The unfilled part of the progress bar. */
const BAR_EMPTY = "#3a3834";

/** Kinds that print without a timestamp. */
const BARE_KINDS = new Set<LogKind>(["boot", "progress"]);

/**
 * Counts from 0 to `total` at `msPerStep`, one queued job per line. Only
 * lines that arrive after the panel is on screen animate; anything already
 * in the log (or a reduced-motion visitor) renders whole. `started` stays
 * false while the line is waiting its turn in the queue.
 */
const useStepped = (total: number, msPerStep: number, animate: boolean, onTick: () => void) => {
  const [step, setStep] = useState(animate ? 0 : total);
  const [started, setStarted] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    let interval = 0;
    let gap = 0;
    const clear = () => {
      window.clearInterval(interval);
      window.clearTimeout(gap);
    };

    const cancel = enqueue({
      start(finish) {
        setStarted(true);
        let i = 0;
        interval = window.setInterval(() => {
          i += 1;
          setStep(i);
          onTick();
          if (i >= total) {
            window.clearInterval(interval);
            gap = window.setTimeout(finish, LINE_GAP_MS);
          }
        }, msPerStep);
      },
      complete() {
        clear();
        setStarted(true);
        setStep(total);
        onTick();
      },
    });

    // Unmounting mid-line (the panel collapsed) hands the turn on.
    return () => {
      clear();
      cancel();
    };
  }, [total, msPerStep, animate, onTick]);

  return { step: animate ? step : total, started };
};

interface LineProps {
  entry: LogEntry;
  promptColor: string;
  compact?: boolean;
  onTick: () => void;
}

const Cursor = ({ color }: { color: string }) => (
  <span aria-hidden="true" className="opacity-80" style={{ color }}>
    ▍
  </span>
);

/**
 * A fixed-width slot measured in characters. HTML collapses the padding
 * spaces in the bar's text, so the label and percent get real boxes: the
 * bar stays put however long the label is.
 */
const slot = (chars: number, align: "left" | "right" = "left") => ({
  display: "inline-block",
  width: `${chars}ch`,
  textAlign: align,
  whiteSpace: "pre" as const,
});

/** npm-style chrome around an apt-style bar: spinner, stage, [bar], percent. */
const ProgressBar = ({ p, accent }: { p: ProgressParts; accent: string }) => (
  <>
    <span style={{ ...slot(1), color: p.complete ? KIND_COLOR.done : accent }}>{p.spinner}</span>
    {" "}
    <span style={slot(STATUS_WIDTH)}>{p.stage.trimEnd()}</span>
    {" ["}
    <span style={slot(PROGRESS_CELLS)}>
      <span style={{ color: accent }}>{p.filled}</span>
      <span style={{ color: BAR_EMPTY }}>{p.empty}</span>
    </span>
    {"] "}
    <span style={{ ...slot(4, "right"), color: "#e6e2dc" }}>{p.percent.trim()}%</span>
  </>
);

/** A finished bar, as logged once the boot is over. */
const FINISHED: ProgressState = { done: 1, total: 1, label: "done" };

/**
 * The live status bar pinned under the log while the intro boots. It
 * redraws every frame: the spinner turns on its own clock and the fill
 * creeps through the current line on the runner's timing.
 */
export const StatusLine = ({ state, accent }: { state: ProgressState; accent: string }) => {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);
  const frame = Math.floor(now / SPINNER_MS);
  return (
    <div className="flex gap-1.5">
      <span className="min-w-0 break-words" style={{ color: KIND_COLOR.progress }}>
        <ProgressBar p={progressParts(state, { frame, now })} accent={accent} />
      </span>
    </div>
  );
};

const Line = ({ entry, promptColor, compact = false, onTick }: LineProps) => {
  // Decided once at mount so a later render can't restart the animation.
  const [animate] = useState(() => !compact && claimStream(entry.id));
  const progress = entry.kind === "progress";
  const total = entry.text.length;
  const perStep = Math.min(TYPE_MS_PER_CHAR, TYPE_MAX_MS / Math.max(total, 1));
  const { step, started } = useStepped(total, perStep, animate, onTick);

  // Waiting its turn in the typing queue: keep the row out of the layout so
  // a lone timestamp isn't sitting there ahead of the line above it.
  if (!started) return null;

  const typing = step < total;

  return (
    <div className="flex gap-1.5">
      {!BARE_KINDS.has(entry.kind) && (
        <span
          className="shrink-0 transition-colors duration-1000"
          style={{ color: promptColor, fontFeatureSettings: '"tnum" 1' }}
        >
          [{formatTime(entry.time)}]
        </span>
      )}
      <span
        className={`min-w-0 ${compact ? "truncate" : "break-words"} ${
          entry.kind === "music" ? "transition-colors duration-1000" : ""
        }`}
        style={
          entry.kind === "music"
            ? { color: promptColor }
            : { color: KIND_COLOR[entry.kind] }
        }
      >
        {progress ? (
          <ProgressBar p={progressParts(FINISHED)} accent={promptColor} />
        ) : (
          entry.text.slice(0, step)
        )}
        {typing && !progress && <Cursor color={promptColor} />}
      </span>
    </div>
  );
};

export default Line;

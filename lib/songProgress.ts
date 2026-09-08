/**
 * Pure helpers behind the Now Playing progress bar's smoothing.
 *
 * Each poll of /api/now-playing is a noisy sample: the edge's Age header is
 * whole seconds, Spotify's own progress_ms wobbles, and different edge
 * regions can be a beat apart. Snapping the bar to every sample renders that
 * noise as visible back-and-forth motion. Instead the bar runs off an anchor
 * (the last sample we trusted) and only re-anchors when a new sample
 * disagrees by more than the threshold, or the track or play state changed.
 */
export interface ProgressAnchor {
  /** Position at `at`. */
  progressMs: number;
  /** Client wall-clock ms when this position was true. */
  at: number;
  songUrl: string;
  isPlaying: boolean;
}

/** Disagreement a fresh sample must show before the bar jumps to it. */
export const RESYNC_THRESHOLD_MS = 1000;

/** Where the anchor says the song is at wall-clock time `now`. */
export const estimateProgress = (anchor: ProgressAnchor, now: number) =>
  anchor.isPlaying
    ? anchor.progressMs + Math.max(0, now - anchor.at)
    : anchor.progressMs;

/**
 * True when `sample` should replace `anchor`: no anchor yet, a different
 * track, a play/pause change, or a real seek (or cache glitch) large enough
 * to be worth showing. Small disagreements are sample noise and are ignored.
 */
export const shouldResync = (
  anchor: ProgressAnchor | null,
  sample: ProgressAnchor,
  now: number,
) => {
  if (!anchor) return true;
  if (anchor.songUrl !== sample.songUrl) return true;
  if (anchor.isPlaying !== sample.isPlaying) return true;
  return (
    Math.abs(estimateProgress(sample, now) - estimateProgress(anchor, now)) >
    RESYNC_THRESHOLD_MS
  );
};

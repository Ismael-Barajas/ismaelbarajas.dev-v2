/**
 * Steam reports playtime in minutes. Under an hour reads as minutes, under
 * ten hours keeps a decimal so short sessions still move, and anything longer
 * rounds to whole hours.
 */
export const formatPlaytime = (minutes: number): string => {
  const safe = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  if (safe < 60) return `${Math.round(safe)} min`;
  // Round first so 9.96 h reads "10 h" rather than "10.0 h".
  const tenths = Math.round(safe / 6) / 10;
  if (tenths < 10) return `${tenths.toFixed(1)} h`;
  return `${Math.round(safe / 60).toLocaleString("en-US")} h`;
};

/**
 * Compact relative time for "last seen" (`5m ago`, `3h ago`, `2d ago`).
 * Takes Steam's unix seconds; `now` is milliseconds like Date.now() and can be
 * pinned by the caller. Every unit floors, so a value never claims more time
 * than passed.
 */
export const formatLastSeen = (
  unixSeconds: number,
  now: number = Date.now(),
): string => {
  const seconds = Math.floor(now / 1000) - unixSeconds;
  if (!(seconds >= 60)) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/**
 * App IDs never shown anywhere on the site. Playing one reads as plain
 * "online", and it's dropped from the top and lately lists. Find an app's ID
 * in its store URL: store.steampowered.com/app/{id}.
 */
export const HIDDEN_APP_IDS: readonly number[] = [
  1366800, // Crosshair X (overlay tool, not a game)
  714010, // Aimlabs (aim trainer)
];

/** Games in the all-time "top" list. */
export const TOP_N = 5;

/** Games in the "lately" (past two weeks) list. */
export const LATELY_N = 5;

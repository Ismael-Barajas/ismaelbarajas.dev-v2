import type { SteamPresence } from "lib/steam";

export type { SteamGame, SteamPresence, SteamPresenceState } from "lib/steam";

export const STEAM_PRESENCE_KEY = "/api/steam/presence";

/** Client poll cadence. The route's 10s edge cache caps what Steam sees. */
export const STEAM_PRESENCE_REFRESH_MS = 10_000;

/** Stop polling once the route says the feature is off; it won't turn on mid-visit. */
export const steamPresenceRefreshInterval = (data?: SteamPresence) =>
  data?.state === "disabled" ? 0 : STEAM_PRESENCE_REFRESH_MS;

/**
 * SWR shares its cache by key, so every hook that reads /api/steam/presence
 * must use this fetcher. It never throws: a 404 becomes `disabled` (env vars
 * unset, render nothing) and any other failure becomes `unavailable`, so
 * consumers branch on `state` alone instead of SWR's error.
 */
const steamPresenceFetcher = async (url: string): Promise<SteamPresence> => {
  try {
    const res = await fetch(url);
    if (res.status === 404) return { state: "disabled" };
    if (!res.ok) return { state: "unavailable" };
    return (await res.json()) as SteamPresence;
  } catch {
    return { state: "unavailable" };
  }
};

export default steamPresenceFetcher;

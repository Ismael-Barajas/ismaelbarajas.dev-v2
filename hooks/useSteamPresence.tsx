import useSWR from "swr";
import steamPresenceFetcher, {
  STEAM_PRESENCE_KEY,
  steamPresenceRefreshInterval,
  type SteamPresence,
} from "lib/steamPresenceFetcher";

/**
 * The one subscription to /api/steam/presence. Every consumer goes through
 * here so they share SWR's cache and a single 10s poll timer. Polling pauses
 * in hidden tabs and stops entirely once the feature reports `disabled`.
 * `data` is undefined until the first response arrives.
 */
const useSteamPresence = () =>
  useSWR<SteamPresence>(STEAM_PRESENCE_KEY, steamPresenceFetcher, {
    refreshInterval: steamPresenceRefreshInterval,
    refreshWhenHidden: false,
  });

export default useSteamPresence;

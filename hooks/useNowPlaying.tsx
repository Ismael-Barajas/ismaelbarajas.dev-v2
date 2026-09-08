import useSWR from "swr";
import nowPlayingFetcher, {
  NOW_PLAYING_KEY,
  nowPlayingRefreshInterval,
  type NowPlayingSong,
} from "lib/nowPlayingFetcher";

/**
 * The one subscription to /api/now-playing. Every consumer goes through here
 * so they share SWR's cache and a single poll timer: 5s while a song is
 * playing, 30s when idle. SWR already pauses polling in hidden tabs.
 */
const useNowPlaying = () =>
  useSWR<NowPlayingSong>(NOW_PLAYING_KEY, nowPlayingFetcher, {
    refreshInterval: nowPlayingRefreshInterval,
  });

export default useNowPlaying;

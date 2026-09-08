import fetcher from "lib/fetcher";

export interface PaletteColors {
  vibrant?: string;
  muted?: string;
  darkVibrant?: string;
  darkMuted?: string;
  lightVibrant?: string;
  lightMuted?: string;
}

export interface NowPlayingSong {
  album: string;
  albumImageUrl: string;
  artist: string;
  durationMs?: number;
  explicit?: boolean;
  isPlaying: boolean;
  palette?: PaletteColors;
  /** ISO timestamp of when the track finished. Only set on the recently-played fallback. */
  playedAt?: string;
  /** 0-100 Spotify popularity score. Only present for tracks. */
  popularity?: number;
  progressMs?: number;
  /** Client wall-clock time when this sample arrived; added by the fetcher. */
  receivedAt: number;
  songUrl: string;
  title: string;
  type?: "track" | "episode";
}

/**
 * SWR shares its cache by key, so every hook that reads /api/now-playing must
 * use this fetcher. It stamps the arrival time so the Now Playing widget can
 * interpolate song progress between polls without impure reads during render.
 */
const nowPlayingFetcher = async (url: string): Promise<NowPlayingSong> => {
  const song = await fetcher<Omit<NowPlayingSong, "receivedAt">>(url);
  return { ...song, receivedAt: Date.now() };
};

export default nowPlayingFetcher;

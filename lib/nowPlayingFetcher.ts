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
  isPlaying: boolean;
  palette?: PaletteColors;
  progressMs?: number;
  /** Client wall-clock time when this sample arrived; added by the fetcher. */
  receivedAt: number;
  songUrl: string;
  title: string;
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

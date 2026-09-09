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

export const NOW_PLAYING_KEY = "/api/now-playing";

/** Client poll cadence. The CDN cache in front of the API route caps what
 *  Spotify actually sees, so a fast poll only costs the site's own edge. */
export const PLAYING_POLL_MS = 5_000;
/** A track is loaded but paused: catch the resume without hammering. */
export const PAUSED_POLL_MS = 10_000;
/** Nothing loaded: the fallback costs two Spotify calls, so back off. */
export const IDLE_POLL_MS = 30_000;

export const nowPlayingRefreshInterval = (data?: NowPlayingSong) => {
  if (data?.isPlaying) return PLAYING_POLL_MS;
  // durationMs is 0 on the last-played fallback, so this is "paused" only.
  if (data?.songUrl && (data.durationMs ?? 0) > 0) return PAUSED_POLL_MS;
  return IDLE_POLL_MS;
};

/**
 * SWR shares its cache by key, so every hook that reads /api/now-playing must
 * use this fetcher. It stamps the arrival time so the Now Playing widget can
 * interpolate song progress between polls without impure reads during render.
 *
 * The API route is CDN-cached, so a response can be several seconds old when
 * it arrives. The edge reports that staleness in the Age header; folding it
 * into progressMs keeps the bar in sync with Spotify without needing the
 * client and server clocks to agree.
 */
const nowPlayingFetcher = async (url: string): Promise<NowPlayingSong> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`now-playing request failed with status ${res.status}`);
  }
  const song = (await res.json()) as Omit<NowPlayingSong, "receivedAt">;

  const ageSeconds = Number(res.headers.get("age") ?? 0);
  const ageMs =
    Number.isFinite(ageSeconds) && ageSeconds > 0 ? ageSeconds * 1000 : 0;

  const progressMs =
    song.isPlaying && typeof song.progressMs === "number"
      ? Math.min(song.progressMs + ageMs, song.durationMs ?? Infinity)
      : song.progressMs;

  return { ...song, progressMs, receivedAt: Date.now() };
};

export default nowPlayingFetcher;

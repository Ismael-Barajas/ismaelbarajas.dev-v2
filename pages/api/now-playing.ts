import type { NextApiRequest, NextApiResponse } from "next";
import { getNowPlaying, getRecentlyPlayed } from "lib/spotify";
import { Vibrant } from "node-vibrant/node";

type Palette = Record<string, string | undefined>;

/**
 * Cache-Control per state. Spotify sends no ETag and `max-age=0`, so every
 * upstream call is a full call against the app's quota; the CDN cache in
 * front of this route is what keeps that cost independent of visitor count.
 *
 *  - active: a track is loaded (playing or paused). Short so the bar and the
 *    play/pause state stay fresh; the client folds the Age header back in.
 *  - idle: nothing loaded. The fallback costs two Spotify calls, so back off.
 */
const ACTIVE_CACHE = "public, s-maxage=5, stale-while-revalidate=5";
const IDLE_CACHE = "public, s-maxage=30, stale-while-revalidate=30";

/** Bounds for honoring Retry-After on a 429 via the CDN cache. */
const MIN_BACKOFF_S = 5;
const MAX_BACKOFF_S = 60;

/**
 * Last payload we successfully built. Served while Spotify is rate limiting
 * us so the widget keeps showing something rather than flashing to idle.
 * Module-level, so it lives as long as the serverless instance does.
 */
let lastKnown: Record<string, unknown> | null = null;

const extractPalette = async (imageUrl: string): Promise<Palette> => {
  if (!imageUrl) return {};
  try {
    const p = await Vibrant.from(imageUrl).getPalette();
    return {
      vibrant: p.Vibrant?.hex,
      muted: p.Muted?.hex,
      darkVibrant: p.DarkVibrant?.hex,
      darkMuted: p.DarkMuted?.hex,
      lightVibrant: p.LightVibrant?.hex,
      lightMuted: p.LightMuted?.hex,
    };
  } catch {
    // Palette extraction is non-critical; return song data without it
    return {};
  }
};

/** Maps a Spotify track or episode object to the fields the widget renders. */
const mapItem = async (item: any, isEpisode: boolean) => {
  // Episodes have a show instead of artists and an album.
  const artist: string = isEpisode
    ? (item.show?.name ?? "Podcast")
    : item.artists.map((a: { name: string }) => a.name).join(", ");
  const album: string = isEpisode ? (item.show?.name ?? "") : item.album.name;
  const images = isEpisode
    ? item.images?.length
      ? item.images
      : (item.show?.images ?? [])
    : item.album.images;
  const albumImageUrl: string = images[0]?.url ?? "";

  return {
    album,
    albumImageUrl,
    artist,
    durationMs: (item.duration_ms as number) ?? 0,
    explicit: Boolean(item.explicit),
    palette: await extractPalette(albumImageUrl),
    // Spotify only scores tracks; episodes have no popularity.
    popularity: isEpisode ? undefined : (item.popularity as number),
    songUrl: item.external_urls.spotify as string,
    title: item.name as string,
    type: isEpisode ? "episode" : "track",
  };
};

/**
 * Spotify returned 429. Two flavors: the rolling 30s rate limit, and the
 * development-mode quota (body carries `reason: "QUOTA_EXCEEDED"`). Either
 * way, honor Retry-After by caching whatever we last had for that long so
 * no visitor's poll reaches Spotify until the window clears.
 */
const handleRateLimited = async (
  response: Response,
  res: NextApiResponse,
  source: string,
) => {
  const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
  const backoff = Math.min(
    MAX_BACKOFF_S,
    Math.max(MIN_BACKOFF_S, Number.isFinite(retryAfter) ? retryAfter : MIN_BACKOFF_S),
  );

  let reason = "RATE_LIMITED";
  try {
    const body = await response.json();
    if (body?.error?.reason) reason = String(body.error.reason);
  } catch {
    // No JSON body on plain rate-limit 429s.
  }
  console.warn(
    `Spotify ${source} 429 (${reason}); retry-after ${retryAfter}s, caching ${backoff}s`,
  );

  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${backoff}, stale-while-revalidate=${backoff}`,
  );
  return res.status(200).json(lastKnown ?? { isPlaying: false });
};

export default async function nowPlaying(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const response = await getNowPlaying();
    // Spotify sampled progress_ms at this instant. Everything after (token
    // refresh, palette extraction, a cold start) delays the response, and the
    // edge cache only starts counting Age once it stores the response.
    const sampledAt = Date.now();

    if (response.status === 429) {
      return handleRateLimited(response, res, "currently-playing");
    }

    // 204 means nothing is loaded; anything else non-200 is treated the same
    // way so a transient upstream error degrades to the last-played state.
    const song =
      response.status === 200 ? await response.json() : { item: null };

    if (song.item) {
      const isEpisode = song.currently_playing_type === "episode";
      const mapped = await mapItem(song.item, isEpisode);
      const isPlaying = Boolean(song.is_playing);
      const sampledProgress = (song.progress_ms as number) ?? 0;
      // Advance the sample to "now" so the stored response is fresh when the
      // edge starts its Age clock, however long this function took.
      const progressMs = isPlaying
        ? Math.min(sampledProgress + (Date.now() - sampledAt), mapped.durationMs)
        : sampledProgress;
      const payload = {
        ...mapped,
        isPlaying,
        progressMs,
      };
      lastKnown = payload;
      res.setHeader("Cache-Control", ACTIVE_CACHE);
      return res.status(200).json(payload);
    }

    // Nothing playing: fall back to the most recently played track.
    res.setHeader("Cache-Control", IDLE_CACHE);
    const recent = await getRecentlyPlayed(1);

    if (recent.status === 429) {
      return handleRateLimited(recent, res, "recently-played");
    }

    if (!recent.ok) {
      if (recent.status === 403) {
        console.warn(
          "recently-played needs the user-read-recently-played scope; re-run npm run spotify:token",
        );
      }
      return res.status(200).json({ isPlaying: false });
    }

    const history = await recent.json();
    const entry = history.items?.[0];
    if (!entry?.track) {
      return res.status(200).json({ isPlaying: false });
    }

    const mapped = await mapItem(entry.track, false);
    const payload = {
      ...mapped,
      // No progress for a finished track; the widget hides the bar.
      durationMs: 0,
      isPlaying: false,
      playedAt: entry.played_at as string,
      progressMs: 0,
    };
    lastKnown = payload;
    return res.status(200).json(payload);
  } catch (error) {
    console.error("now-playing error:", error);
    return res.status(500).json({ isPlaying: false });
  }
}

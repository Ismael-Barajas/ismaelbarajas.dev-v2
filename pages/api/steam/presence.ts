import type { NextApiRequest, NextApiResponse } from "next";
import { Vibrant } from "node-vibrant/node";
import type { PaletteColors } from "lib/nowPlayingFetcher";
import {
  getPlayerSummary,
  isSteamConfigured,
  toPresence,
  type SteamPlayer,
  type SteamPresence,
} from "lib/steam";

/**
 * Response contract (the client fetcher maps these to SteamPresence):
 *
 *  - 200 SteamPresence: fresh, or the last known presence while Steam errors
 *    or rate limits us.
 *  - 200 { state: "unavailable" }: rate limited with nothing cached yet.
 *    Cached for the Retry-After window so polls don't reach Steam.
 *  - 502 { state: "unavailable" }: Steam failed with nothing cached, like
 *    now-playing's 502.
 *  - 404: STEAM_API_KEY / STEAM_ID unset; the feature is off.
 *
 * Presence flips on a game launch, so a short edge cache with no
 * stale-while-revalidate: while Steam answers, a visitor sees a state at most
 * ~10s old. The error fallback can be older, since it serves lastKnown.
 */
const PRESENCE_CACHE = "public, s-maxage=10";

/** Bounds for honoring Retry-After on a 429 via the CDN cache. */
const MIN_BACKOFF_S = 5;
const MAX_BACKOFF_S = 60;

/**
 * Last presence we successfully built. Served while Steam errors or rate
 * limits us so the site keeps showing something. Module-level, so it lives as
 * long as the serverless instance does.
 */
let lastKnown: SteamPresence | null = null;

/**
 * Header art palettes by app ID. Art for an app doesn't change, so one
 * extraction per instance is enough. Failures aren't stored, so a transient
 * fetch error retries on the next miss.
 */
const paletteCache = new Map<number, PaletteColors>();

/**
 * Hosts header art may be fetched from for palette extraction. Anything else
 * is skipped so an unexpected URL can't turn this function into a fetch proxy.
 * Mirrors images.remotePatterns in next.config.
 */
const PALETTE_HOSTS = [
  /^shared\.akamai\.steamstatic\.com$/,
  /^cdn\.akamai\.steamstatic\.com$/,
];

export const isAllowedImageUrl = (imageUrl: string): boolean => {
  try {
    const url = new URL(imageUrl);
    return (
      url.protocol === "https:" &&
      PALETTE_HOSTS.some((re) => re.test(url.hostname))
    );
  } catch {
    return false;
  }
};

const extractPalette = async (
  appId: number,
  imageUrl: string,
): Promise<PaletteColors> => {
  const cached = paletteCache.get(appId);
  if (cached) return cached;
  if (!isAllowedImageUrl(imageUrl)) return {};
  try {
    const p = await Vibrant.from(imageUrl).getPalette();
    const palette = {
      vibrant: p.Vibrant?.hex,
      muted: p.Muted?.hex,
      darkVibrant: p.DarkVibrant?.hex,
      darkMuted: p.DarkMuted?.hex,
      lightVibrant: p.LightVibrant?.hex,
      lightMuted: p.LightMuted?.hex,
    };
    paletteCache.set(appId, palette);
    return palette;
  } catch {
    // Palette extraction is non-critical; return presence without it
    return {};
  }
};

/**
 * Steam returned 429. Honor Retry-After by caching whatever we last had for
 * that long so no visitor's poll reaches Steam until the window clears.
 */
const handleRateLimited = (response: Response, res: NextApiResponse) => {
  const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
  const backoff = Math.min(
    MAX_BACKOFF_S,
    Math.max(MIN_BACKOFF_S, Number.isFinite(retryAfter) ? retryAfter : MIN_BACKOFF_S),
  );
  console.warn(
    `Steam GetPlayerSummaries 429; retry-after ${retryAfter}s, caching ${backoff}s`,
  );

  res.setHeader("Cache-Control", `public, s-maxage=${backoff}`);
  return res.status(200).json(lastKnown ?? { state: "unavailable" });
};

export default async function steamPresence(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSteamConfigured()) {
    return res.status(404).json({ error: "Steam not configured" });
  }

  try {
    const response = await getPlayerSummary();

    if (response.status === 429) {
      return handleRateLimited(response, res);
    }

    if (!response.ok) {
      throw new Error(`GetPlayerSummaries failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      response?: { players?: SteamPlayer[] };
    };
    const player = data.response?.players?.[0];
    if (!player) {
      // A wrong STEAM_ID returns an empty list rather than an error.
      throw new Error("GetPlayerSummaries returned no player");
    }

    const presence = toPresence(player);
    const { game } = presence;
    const payload: SteamPresence =
      game?.appId != null && game.headerUrl
        ? { ...presence, palette: await extractPalette(game.appId, game.headerUrl) }
        : presence;

    lastKnown = payload;
    res.setHeader("Cache-Control", PRESENCE_CACHE);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("steam presence error:", error);
    if (lastKnown) {
      res.setHeader("Cache-Control", PRESENCE_CACHE);
      return res.status(200).json(lastKnown);
    }
    return res.status(502).json({ state: "unavailable" });
  }
}

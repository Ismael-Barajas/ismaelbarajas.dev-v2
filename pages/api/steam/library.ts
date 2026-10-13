import type { NextApiRequest, NextApiResponse } from "next";
import {
  getOwnedGames,
  isSteamConfigured,
  toLibrary,
  type SteamOwnedGame,
} from "lib/steam";

/**
 * Playtime totals move slowly, so cache for hours and keep serving the stale
 * copy for a day while it revalidates. 404 when STEAM_API_KEY / STEAM_ID are
 * unset; 502 when Steam fails or the profile's Game details are private.
 */
const LIBRARY_CACHE = "public, s-maxage=21600, stale-while-revalidate=86400";

export default async function steamLibrary(
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

  let games: SteamOwnedGame[];
  try {
    const response = await getOwnedGames();
    const data = response.ok
      ? ((await response.json()) as { response?: { games?: SteamOwnedGame[] } })
      : null;

    if (!Array.isArray(data?.response?.games)) {
      // A 200 with an empty `response` means Game details are private.
      console.warn(
        response.ok
          ? "steam library: no games returned; set the profile's Game details to public"
          : `steam library: GetOwnedGames failed with status ${response.status}`,
      );
      return res
        .status(502)
        .json({ error: "Steam unavailable", top: [], lately: [] });
    }
    games = data.response.games;
  } catch (error) {
    console.error("steam library error:", error);
    return res
      .status(502)
      .json({ error: "Steam unavailable", top: [], lately: [] });
  }

  res.setHeader("Cache-Control", LIBRARY_CACHE);
  return res.status(200).json(toLibrary(games));
}

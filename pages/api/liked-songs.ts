import type { NextApiRequest, NextApiResponse } from "next";
import { getSavedTracks } from "lib/spotify";

type SavedTrack = {
  album: { images: { url: string }[] };
  artists: { name: string }[];
  duration_ms: number;
  explicit: boolean;
  external_urls: { spotify: string };
  name: string;
  popularity: number;
};

type SavedEntry = {
  added_at: string;
  /** null when the track has since been removed from Spotify's catalog. */
  track: SavedTrack | null;
};

const UNAVAILABLE = { error: "Spotify unavailable", total: 0, tracks: [] };

/** Liked-songs total plus the most recently saved tracks. */
export default async function likedSongs(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await getSavedTracks(10);
    if (!response.ok) {
      if (response.status === 403) {
        console.warn(
          "liked-songs needs the user-library-read scope; re-run npm run spotify:token",
        );
      }
      return res.status(502).json(UNAVAILABLE);
    }

    const data = await response.json();

    const tracks = ((data.items ?? []) as SavedEntry[])
      .filter(
        (entry): entry is SavedEntry & { track: SavedTrack } =>
          Boolean(entry?.track),
      )
      .map((entry) => ({
        addedAt: entry.added_at,
        albumImageUrl: entry.track.album?.images?.[0]?.url ?? "",
        artist: (entry.track.artists ?? []).map((a) => a.name).join(", "),
        durationMs: entry.track.duration_ms ?? 0,
        explicit: Boolean(entry.track.explicit),
        popularity: entry.track.popularity,
        songUrl: entry.track.external_urls?.spotify ?? "",
        title: entry.track.name,
      }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=3600",
    );

    return res.status(200).json({ total: data.total ?? tracks.length, tracks });
  } catch (error) {
    console.error("liked-songs error:", error);
    return res.status(502).json(UNAVAILABLE);
  }
}

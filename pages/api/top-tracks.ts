import type { NextApiRequest, NextApiResponse } from "next";
import { getTopTracks, type TimeRange } from "lib/spotify";

const TIME_RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

// https://leerob.io/snippets/spotify
export default async function topTracks(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requested = Array.isArray(req.query.range)
    ? req.query.range[0]
    : req.query.range;
  const range: TimeRange = TIME_RANGES.includes(requested as TimeRange)
    ? (requested as TimeRange)
    : "short_term";

  let data;
  try {
    const response = await getTopTracks(range, 10);
    data = await response.json();

    if (!response.ok || !data.items) {
      return res
        .status(502)
        .json({ error: "Spotify unavailable", range, tracks: [] });
    }
  } catch (error) {
    console.error("top-tracks error:", error);
    return res
      .status(502)
      .json({ error: "Spotify unavailable", range, tracks: [] });
  }

  const tracks = data.items.map(
    (track: {
      album: { images: { url: string }[] };
      artists: { name: string }[];
      duration_ms: number;
      explicit: boolean;
      external_urls: { spotify: string };
      name: string;
      popularity: number;
    }) => ({
      albumImageUrl: track.album.images?.[0]?.url ?? "",
      artist: track.artists.map((a) => a.name).join(", "),
      durationMs: track.duration_ms ?? 0,
      explicit: Boolean(track.explicit),
      popularity: track.popularity,
      songUrl: track.external_urls.spotify,
      title: track.name,
    }),
  );

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=43200",
  );

  return res.status(200).json({ range, tracks });
}

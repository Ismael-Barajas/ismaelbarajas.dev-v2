import type { NextApiRequest, NextApiResponse } from "next";
import { getNowPlaying } from "lib/spotify";

export default async function nowPlaying(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const response = await getNowPlaying();

    if (response.status === 204 || response.status >= 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();

    if (!song.item) {
      return res.status(200).json({ isPlaying: false });
    }

    const isPlaying: boolean = song.is_playing;
    const title: string = song.item.name;
    const artist: string = song.item.artists
      .map((a: { name: string }) => a.name)
      .join(", ");
    const album: string = song.item.album.name;
    const albumImageUrl: string = song.item.album.images[0].url;
    const songUrl: string = song.item.external_urls.spotify;

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30",
    );

    return res.status(200).json({
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
    });
  } catch (error) {
    console.error("now-playing error:", error);
    return res.status(500).json({ isPlaying: false });
  }
}

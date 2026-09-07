import type { NextApiRequest, NextApiResponse } from "next";
import { getNowPlaying } from "lib/spotify";
import { Vibrant } from "node-vibrant/node";

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
    const progressMs: number = song.progress_ms ?? 0;
    const durationMs: number = song.item.duration_ms ?? 0;

    let palette: Record<string, string | undefined> = {};
    try {
      const vibrantPalette = await Vibrant.from(albumImageUrl).getPalette();
      palette = {
        vibrant: vibrantPalette.Vibrant?.hex,
        muted: vibrantPalette.Muted?.hex,
        darkVibrant: vibrantPalette.DarkVibrant?.hex,
        darkMuted: vibrantPalette.DarkMuted?.hex,
        lightVibrant: vibrantPalette.LightVibrant?.hex,
        lightMuted: vibrantPalette.LightMuted?.hex,
      };
    } catch {
      // Palette extraction is non-critical; return song data without it
    }

    // Short cache: the client interpolates progress from when it received the
    // response, so a long CDN cache would make the bar lag behind Spotify.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=5, stale-while-revalidate=5",
    );

    return res.status(200).json({
      album,
      albumImageUrl,
      artist,
      durationMs,
      isPlaying,
      palette,
      progressMs,
      songUrl,
      title,
    });
  } catch (error) {
    console.error("now-playing error:", error);
    return res.status(500).json({ isPlaying: false });
  }
}

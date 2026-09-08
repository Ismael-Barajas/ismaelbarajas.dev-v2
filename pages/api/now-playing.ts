import type { NextApiRequest, NextApiResponse } from "next";
import { getNowPlaying, getRecentlyPlayed } from "lib/spotify";
import { Vibrant } from "node-vibrant/node";

type Palette = Record<string, string | undefined>;

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

export default async function nowPlaying(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Short cache: the client interpolates progress from when it received the
    // response, so a long CDN cache would make the bar lag behind Spotify.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=5, stale-while-revalidate=5",
    );

    const response = await getNowPlaying();
    const song =
      response.status === 200 ? await response.json() : { item: null };

    if (song.item) {
      const isEpisode = song.currently_playing_type === "episode";
      const mapped = await mapItem(song.item, isEpisode);
      return res.status(200).json({
        ...mapped,
        isPlaying: Boolean(song.is_playing),
        progressMs: (song.progress_ms as number) ?? 0,
      });
    }

    // Nothing playing: fall back to the most recently played track.
    const recent = await getRecentlyPlayed(1);
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
    return res.status(200).json({
      ...mapped,
      // No progress for a finished track; the widget hides the bar.
      durationMs: 0,
      isPlaying: false,
      playedAt: entry.played_at as string,
      progressMs: 0,
    });
  } catch (error) {
    console.error("now-playing error:", error);
    return res.status(500).json({ isPlaying: false });
  }
}

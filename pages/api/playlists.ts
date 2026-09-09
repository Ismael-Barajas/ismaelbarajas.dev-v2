import type { NextApiRequest, NextApiResponse } from "next";
import { getMe, getPlaylists } from "lib/spotify";

/** Public playlists owned by the account. Followed and private ones are skipped. */
export default async function playlists(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [meRes, listRes] = await Promise.all([getMe(), getPlaylists(50)]);
    if (!meRes.ok || !listRes.ok) {
      if (listRes.status === 403) {
        console.warn(
          "playlists needs the playlist-read-private scope; re-run npm run spotify:token",
        );
      }
      return res
        .status(502)
        .json({ error: "Spotify unavailable", playlists: [] });
    }

    const me = await meRes.json();
    const data = await listRes.json();

    const result = (data.items ?? [])
      .filter(
        (p: { owner: { id: string }; public: boolean | null }) =>
          p.owner?.id === me.id && p.public === true,
      )
      .map(
        (p: {
          description: string | null;
          external_urls: { spotify: string };
          images: { url: string }[] | null;
          name: string;
          tracks: { total: number };
        }) => ({
          description: p.description ?? "",
          imageUrl: p.images?.[0]?.url ?? "",
          name: p.name,
          trackCount: p.tracks?.total ?? 0,
          url: p.external_urls.spotify,
        }),
      );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=43200",
    );

    return res.status(200).json({ playlists: result });
  } catch (error) {
    console.error("playlists error:", error);
    return res
      .status(502)
      .json({ error: "Spotify unavailable", playlists: [] });
  }
}

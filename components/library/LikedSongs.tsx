import useSWR from "swr";
import Image from "next/image";
import fetcher from "lib/fetcher";
import { timeAgo } from "lib/time";
import { TrackMeta, type TrackSummary } from "./TopTracks";

interface SavedTrack extends TrackSummary {
  addedAt: string;
}

interface LikedSongsResponse {
  total: number;
  tracks: SavedTrack[];
  /** Client wall-clock time when this arrived; added by the fetcher. */
  receivedAt: number;
}

// Stamp arrival time so "saved 2 days ago" can be computed without impure
// clock reads during render.
const likedSongsFetcher = async (url: string): Promise<LikedSongsResponse> => {
  const body = await fetcher<Omit<LikedSongsResponse, "receivedAt">>(url);
  return { ...body, receivedAt: Date.now() };
};

const LikedSongs = () => {
  const { data, isLoading } = useSWR<LikedSongsResponse>(
    "/api/liked-songs",
    likedSongsFetcher,
  );

  const tracks = data?.tracks ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4">
        <div className="mx-auto h-8 w-40 animate-pulse rounded bg-[#2b2828]/40" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded bg-[#2b2828]/40"
          />
        ))}
      </div>
    );
  }

  if (!data || tracks.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500">No liked songs yet.</p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4">
      <div className="mb-4 flex items-baseline justify-center gap-2">
        <span className="text-3xl font-medium tabular-nums text-text">
          {data.total.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          liked songs
        </span>
      </div>
      <p className="mb-1 text-center text-[11px] uppercase tracking-wider text-gray-500">
        Recently saved
      </p>
      {tracks.map((track) => (
        <div
          key={track.songUrl}
          className="flex w-full items-center gap-3 border-b border-gray-800 py-2.5 dark:border-gray-200"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
            {track.albumImageUrl ? (
              <Image
                src={track.albumImageUrl}
                alt={track.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#2b2828]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <a href={track.songUrl} target="_blank" rel="noopener noreferrer">
              <p className="animated-underline w-fit max-w-full truncate font-medium text-text">
                {track.title}
              </p>
            </a>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {track.artist}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TrackMeta track={track} />
            <span
              className="text-[11px] text-gray-500"
              title={new Date(track.addedAt).toLocaleString()}
            >
              {timeAgo(track.addedAt, data.receivedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LikedSongs;

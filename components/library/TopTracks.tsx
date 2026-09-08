import useSWR from "swr";
import { useState } from "react";
import Image from "next/image";
import fetcher from "lib/fetcher";
import { formatDuration } from "lib/time";
import PopularityFlame from "./PopularityFlame";

export interface TrackSummary {
  albumImageUrl: string;
  artist: string;
  durationMs: number;
  explicit: boolean;
  popularity: number;
  songUrl: string;
  title: string;
}

interface TopTracksResponse {
  range: string;
  tracks: TrackSummary[];
}

const RANGES = [
  { key: "short_term", label: "4 weeks" },
  { key: "medium_term", label: "6 months" },
  { key: "long_term", label: "All time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

/** Shared meta strip: flame with score and track length. */
export const TrackMeta = ({
  track,
  className = "",
}: {
  track: Pick<TrackSummary, "popularity" | "durationMs">;
  className?: string;
}) => (
  <div
    className={`flex items-center gap-3 text-xs tabular-nums text-gray-500 dark:text-gray-400 ${className}`}
  >
    <PopularityFlame popularity={track.popularity} size={14} />
    <span>{formatDuration(track.durationMs)}</span>
  </div>
);

const PodiumCard = ({ track, rank }: { track: TrackSummary; rank: number }) => (
  <a
    href={track.songUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative flex flex-col rounded-lg bg-[#191414] p-3 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
  >
    <span className="absolute left-5 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#121212]/90 text-xs font-medium text-gray-100">
      {rank}
    </span>
    <div className="relative mb-3 aspect-square w-full overflow-hidden rounded">
      {track.albumImageUrl ? (
        <Image
          src={track.albumImageUrl}
          alt={track.title}
          fill
          sizes="(max-width: 640px) 90vw, 200px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="h-full w-full bg-[#2b2828]" />
      )}
    </div>
    <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-100">
      {track.title}
    </p>
    <p className="truncate text-xs text-gray-400">{track.artist}</p>
    <TrackMeta track={track} className="mt-auto pt-2 !text-gray-400" />
  </a>
);

const TrackRow = ({ track, rank }: { track: TrackSummary; rank: number }) => (
  <div className="flex w-full items-center gap-3 border-b border-gray-800 py-2.5 dark:border-gray-200">
    <span className="w-6 text-right text-sm font-medium tabular-nums text-gray-500 dark:text-gray-400">
      {rank}
    </span>
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
    <TrackMeta track={track} className="shrink-0" />
  </div>
);

const TopTracks = () => {
  const [range, setRange] = useState<RangeKey>("short_term");
  const { data, isLoading } = useSWR<TopTracksResponse>(
    `/api/top-tracks?range=${range}`,
    fetcher,
    { keepPreviousData: true },
  );

  const tracks = data?.tracks ?? [];
  const podium = tracks.slice(0, 3);
  const rest = tracks.slice(3);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4">
      <div
        className="mb-6 flex gap-2"
        role="tablist"
        aria-label="Top tracks time range"
      >
        {RANGES.map((r) => {
          const active = r.key === range;
          return (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRange(r.key)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-300 ${
                active
                  ? "border-primary bg-primary text-background"
                  : "border-secondary text-gray-600 hover:text-text dark:text-gray-400 dark:hover:text-text"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {isLoading && tracks.length === 0 ? (
        <div className="grid w-full grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-[#2b2828]/40"
            />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-gray-500">No top tracks yet.</p>
      ) : (
        <>
          <div
            className={`grid w-full grid-cols-3 gap-3 transition-opacity duration-300 ${
              isLoading ? "opacity-60" : ""
            }`}
          >
            {podium.map((track, i) => (
              <PodiumCard key={track.songUrl} track={track} rank={i + 1} />
            ))}
          </div>
          <div
            className={`mt-4 flex w-full flex-col transition-opacity duration-300 ${
              isLoading ? "opacity-60" : ""
            }`}
          >
            {rest.map((track, i) => (
              <TrackRow key={track.songUrl} track={track} rank={i + 4} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TopTracks;

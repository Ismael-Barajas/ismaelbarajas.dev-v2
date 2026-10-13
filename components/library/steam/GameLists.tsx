import useSWR from "swr";
import fetcher from "lib/fetcher";
import type { SteamLibrary } from "lib/steam";
import GameList from "./GameList";

const SKELETON_ROWS = [0, 1, 2];

const ListSkeleton = () => (
  <div className="flex flex-col" aria-hidden="true">
    <div className="mb-3 h-6 w-32 animate-pulse rounded bg-[#2b2828]/40 motion-reduce:animate-none" />
    {SKELETON_ROWS.map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 border-b border-gray-800 py-2.5 dark:border-gray-200"
      >
        <div className="aspect-[460/215] w-24 shrink-0 animate-pulse rounded bg-[#2b2828]/40 motion-reduce:animate-none" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-40 max-w-full animate-pulse rounded bg-[#2b2828]/40 motion-reduce:animate-none" />
          <div className="h-3 w-24 animate-pulse rounded bg-[#2b2828]/40 motion-reduce:animate-none" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Top games and the past two weeks, from /api/steam/library. Fetched once per
 * visit: the route is cached at the CDN for hours, so there is nothing to poll.
 */
const GameLists = () => {
  const { data, error, isLoading } = useSWR<SteamLibrary>(
    "/api/steam/library",
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-8"
        role="status"
        aria-label="Loading games"
      >
        <ListSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-center text-sm text-gray-500">
        Couldn&apos;t load games right now.
      </p>
    );
  }

  if (data.top.length === 0 && data.lately.length === 0) {
    return <p className="text-center text-sm text-gray-500">No games yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <GameList title="Top games" games={data.top} variant="top" />
      <GameList title="Lately" games={data.lately} variant="lately" />
    </div>
  );
};

export default GameLists;

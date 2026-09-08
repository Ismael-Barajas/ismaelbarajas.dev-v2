import useSWR from "swr";
import Image from "next/image";
import fetcher from "lib/fetcher";

interface Playlist {
  description: string;
  imageUrl: string;
  name: string;
  trackCount: number;
  url: string;
}

interface PlaylistsResponse {
  playlists: Playlist[];
}

const Playlists = () => {
  const { data, isLoading } = useSWR<PlaylistsResponse>(
    "/api/playlists",
    fetcher,
  );

  const playlists = data?.playlists ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-lg bg-[#2b2828]/40"
          />
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500">
        No public playlists to show.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {playlists.map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-lg bg-[#191414] p-3 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 45vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="h-full w-full bg-[#2b2828]" />
              )}
            </div>
            <p className="animated-underline w-fit max-w-full truncate text-sm font-medium text-gray-100">
              {p.name}
            </p>
            <p className="text-xs text-gray-400">
              {p.trackCount} {p.trackCount === 1 ? "song" : "songs"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Playlists;

import useSWR from "swr";

import fetcher from "lib/fetcher";

interface Song {
  songUrl: string;
  artist: string;
  title: string;
}

interface TopTracks {
  tracks: Song[];
}

const TopTracks = () => {
  const { data } = useSWR<TopTracks>("/api/top-tracks", fetcher);

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col items-center px-4">
      {data.tracks.map((track, index) => (
        <div
          key={track.songUrl}
          className="flex flex-row items-baseline border-b dark:border-gray-200 border-gray-800 sm:max-w-5xl w-full mt-8"
        >
          <p className="text-sm font-bold text-roseDust">{index + 1}</p>
          <div className="flex flex-col pl-3">
            <a
              className="font-medium text-text truncate"
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="animated-underline w-fit">{track.title}</p>
            </a>
            <p
              className="text-gray-500 dark:text-gray-400 mb-4 truncate"
              color="gray.500"
            >
              {track.artist}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopTracks;

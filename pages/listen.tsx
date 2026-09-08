import useSWR from "swr";
import useTheme from "hooks/useTheme";
import {
  AnimatedContent,
  LikedSongs,
  ListenTabs,
  Metatags,
  NowPlaying,
  Plasma,
  Playlists,
  TopTracks,
} from "components";
import { useListenTab } from "components/library/ListenTabs";
import nowPlayingFetcher, { type NowPlayingSong } from "lib/nowPlayingFetcher";
import type { NextPage } from "next";

const Listen: NextPage = () => {
  const { resolvedTheme } = useTheme();
  const [tab, setTab] = useListenTab();
  const { data } = useSWR<NowPlayingSong>(
    "/api/now-playing",
    nowPlayingFetcher,
    {
      refreshInterval: 10000,
    },
  );

  // Match the widget: only an actively playing song tints the plasma.
  const accentColor = data?.isPlaying
    ? data.palette?.vibrant || data.palette?.muted || null
    : null;
  const plasmaColor =
    accentColor ?? (resolvedTheme === "dark" ? "#888888" : "#444444");

  return (
    <div className="relative -mt-16 min-h-screen pt-16">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <Plasma
          color={plasmaColor}
          speed={0.7}
          direction="reverse"
          scale={1}
          opacity={0.9}
          mouseInteractive={true}
        />
      </div>
      <div className="container items-center content-center pt-4 pb-10 relative z-10">
        <Metatags
          title="Jammin out :)"
          description="What im currently listening too."
        />
        <AnimatedContent distance={50} duration={2} threshold={0.1}>
          <NowPlaying variant="compact" />
        </AnimatedContent>
        <AnimatedContent
          distance={50}
          duration={2}
          delay={0.15}
          threshold={0.1}
        >
          <div className="mx-auto mt-6 max-w-3xl rounded-xl bg-[#E0E0E0]/70 px-2 py-6 shadow-card backdrop-blur-md dark:bg-[#121212]/70 sm:px-4">
            <ListenTabs active={tab} onChange={setTab} />
            <div id={`listen-panel-${tab}`} role="tabpanel">
              {tab === "top" && <TopTracks />}
              {tab === "playlists" && <Playlists />}
              {tab === "liked" && <LikedSongs />}
            </div>
          </div>
        </AnimatedContent>
      </div>
    </div>
  );
};

export default Listen;

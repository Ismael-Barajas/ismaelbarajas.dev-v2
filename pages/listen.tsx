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
import useNowPlaying from "hooks/useNowPlaying";
import type { NextPage } from "next";

const Listen: NextPage = () => {
  const { resolvedTheme } = useTheme();
  const [tab, setTab] = useListenTab();
  const { data } = useNowPlaying();

  // Match the widget: only an actively playing song tints the plasma.
  const accentColor = data?.isPlaying
    ? data.palette?.vibrant || data.palette?.muted || null
    : null;
  const plasmaColor =
    accentColor ?? (resolvedTheme === "dark" ? "#888888" : "#444444");

  return (
    <div className="relative -mt-16 min-h-screen pt-16">
      {/* Pinned to the viewport so its size never follows the active tab's
          content height, which would rescale the pattern on tab switches. */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
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
        <AnimatedContent>
          <NowPlaying variant="compact" />
        </AnimatedContent>
        <AnimatedContent delay={0.1}>
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

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
import {
  LISTEN_TABS,
  panelId,
  tabId,
  useListenTab,
} from "components/library/ListenTabs";
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
            {/* Every panel exists so each tab's aria-controls resolves, but
                only the active one mounts its content: each panel is its own
                Spotify call, and we don't want three per visit. */}
            {LISTEN_TABS.map((t) => {
              const isActive = t.key === tab;
              return (
                <div
                  key={t.key}
                  id={panelId(t.key)}
                  role="tabpanel"
                  aria-labelledby={tabId(t.key)}
                  hidden={!isActive}
                >
                  {isActive && t.key === "top" && <TopTracks />}
                  {isActive && t.key === "playlists" && <Playlists />}
                  {isActive && t.key === "liked" && <LikedSongs />}
                </div>
              );
            })}
          </div>
        </AnimatedContent>
      </div>
    </div>
  );
};

export default Listen;

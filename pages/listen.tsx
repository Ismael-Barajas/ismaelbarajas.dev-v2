import useSWR from "swr";
import { useTheme } from "next-themes";
import {
  AnimatedContent,
  Metatags,
  NowPlaying,
  Plasma,
  TopTracks,
} from "components";
import fetcher from "lib/fetcher";
import type { NextPage } from "next";

interface NowPlayingData {
  palette?: {
    vibrant?: string;
    muted?: string;
  };
}

const Listen: NextPage = () => {
  const { resolvedTheme } = useTheme();
  const { data } = useSWR<NowPlayingData>("/api/now-playing", fetcher, {
    refreshInterval: 10000,
  });

  const accentColor = data?.palette?.vibrant || data?.palette?.muted || null;
  const plasmaColor =
    accentColor ?? (resolvedTheme === "dark" ? "#888888" : "#444444");

  return (
    <div className="relative min-h-screen-without-nav">
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
      <div className="container items-center content-center py-10 relative z-10">
        <Metatags
          title="Jammin out :)"
          description="What im currently listening too."
        />
        <AnimatedContent distance={50} duration={2} threshold={0.1}>
          <NowPlaying />
        </AnimatedContent>
        <AnimatedContent
          distance={50}
          duration={2}
          delay={0.15}
          threshold={0.1}
        >
          <TopTracks />
        </AnimatedContent>
      </div>
    </div>
  );
};

export default Listen;

import { Metatags, NowPlaying, TopTracks } from "components";
import type { NextPage } from "next";

const Listen: NextPage = () => {
  return (
    <div className="relative min-h-screen-without-nav">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.25,
          transition: "--now-playing-accent 1200ms ease-in-out",
        }}
      />
      <div className="container items-center content-center py-10 relative z-10">
        <Metatags
          title="Jammin out :)"
          description="What im currently listening too."
        />
        <NowPlaying />
        <TopTracks />
      </div>
    </div>
  );
};

export default Listen;

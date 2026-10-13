import type { CSSProperties } from "react";
import type { NextPage } from "next";
import { AnimatedContent, Metatags, Plasma } from "components";
import GameLists from "components/library/steam/GameLists";
import PresenceCard from "components/library/steam/PresenceCard";
import usePerformanceTier from "hooks/usePerformanceTier";
import useSteamPresence from "hooks/useSteamPresence";
import { TERMINAL_ORANGE } from "lib/navLog";

const Play: NextPage = () => {
  const { tier } = usePerformanceTier();
  const { data: presence } = useSteamPresence();

  // Only an active game tints the page, from its own header art. The color
  // lives on this wrapper as --steam-accent; --now-playing-accent belongs to
  // Spotify and is never touched here.
  const accentColor =
    presence?.state === "playing"
      ? presence.palette?.vibrant || presence.palette?.muted || null
      : null;
  const plasmaColor = accentColor ?? TERMINAL_ORANGE;
  const scope = accentColor
    ? ({ "--steam-accent": accentColor } as CSSProperties)
    : undefined;

  return (
    <div className="relative -mt-16 min-h-screen pt-16" style={scope}>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Plasma
          color={plasmaColor}
          speed={0.7}
          direction="reverse"
          scale={1}
          opacity={0.9}
          mouseInteractive={true}
          quality={tier}
        />
      </div>
      <div className="container items-center content-center pt-4 pb-10 relative z-10">
        <Metatags
          title="Game on :)"
          description="What I'm currently playing on Steam."
        />
        {presence?.state === "disabled" ? (
          <AnimatedContent>
            <div className="mx-auto mt-6 max-w-lg rounded-xl bg-[#E0E0E0]/70 px-4 py-6 text-center shadow-card backdrop-blur-md dark:bg-[#121212]/70">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Steam isn&apos;t connected right now.
              </p>
            </div>
          </AnimatedContent>
        ) : (
          <>
            <AnimatedContent>
              <PresenceCard presence={presence} />
            </AnimatedContent>
            <AnimatedContent delay={0.1}>
              <div className="mx-auto mt-6 max-w-3xl rounded-xl bg-[#E0E0E0]/70 px-2 py-6 shadow-card backdrop-blur-md dark:bg-[#121212]/70 sm:px-4">
                <div className="mx-auto w-full max-w-2xl px-4">
                  <GameLists />
                </div>
              </div>
            </AnimatedContent>
          </>
        )}
      </div>
    </div>
  );
};

export default Play;

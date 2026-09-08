import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate } from "motion/mini";
import useNowPlaying from "hooks/useNowPlaying";
import type { NowPlayingSong } from "lib/nowPlayingFetcher";
import { mixWithWhite } from "lib/color";
import { formatDuration, timeAgo } from "lib/time";
import PopularityFlame from "./PopularityFlame";
import Image from "next/image";

/**
 * Visual style of the now-playing card. Flip this to compare.
 *  - "backdrop": the album cover, blurred and dimmed, becomes the card
 *                background. White text. No palette tinting of the card.
 *  - "float":    no card at all; art casts a palette glow and text sits on
 *                the page. Relies on the frosted panel below for contrast.
 *  - "classic":  the original dark card tinted with the album palette.
 */
type CardStyle = "backdrop" | "float" | "classic";
const CARD_STYLE = "backdrop" as CardStyle;

/**
 * Interpolates song position between API polls. Each poll gives a fresh
 * progressMs; while the song is playing we add the wall-clock time elapsed
 * since that poll arrived so the bar moves smoothly instead of jumping on
 * every poll. Pausing or seeking on Spotify is picked up on the next poll.
 *
 * When the interpolated position reaches the end of the track we ask SWR to
 * revalidate right away, so the next song shows up within a couple of seconds
 * instead of waiting out the poll interval plus the CDN cache.
 */
const useSongProgress = (
  data?: NowPlayingSong,
  revalidate?: () => Promise<unknown>,
) => {
  const progressMs = data?.progressMs ?? 0;
  const durationMs = data?.durationMs ?? 0;
  const isPlaying = data?.isPlaying ?? false;
  const receivedAt = data?.receivedAt ?? 0;

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!isPlaying || durationMs === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isPlaying, durationMs]);

  const elapsed =
    isPlaying && receivedAt > 0 ? Math.max(0, now - receivedAt) : 0;
  const progress = Math.min(progressMs + elapsed, durationMs);

  // One revalidate per sample: receivedAt changes with every poll, so a
  // sample that still says "playing" at the end of the track (Spotify is
  // a beat behind, or the edge cache is stale) only fires once.
  const ended = isPlaying && durationMs > 0 && progress >= durationMs;
  const firedFor = useRef(0);
  useEffect(() => {
    if (!ended || !revalidate || firedFor.current === receivedAt) return;
    firedFor.current = receivedAt;
    void revalidate();
  }, [ended, receivedAt, revalidate]);

  return { progress, duration: durationMs };
};

const ExplicitBadge = () => (
  <span
    className="shrink-0 rounded-sm bg-[#8a8a8a] px-1 text-[10px] font-medium leading-[1.3] text-[#191414]"
    title="Explicit"
    aria-label="Explicit"
  >
    E
  </span>
);

const LastPlayedLabel = ({
  playedAt,
  now,
  color,
  className = "",
}: {
  playedAt: string;
  now: number;
  color?: string;
  className?: string;
}) => (
  <div
    className={`flex items-center gap-1 text-[11px] leading-none mb-1 ${className}`}
    style={color ? { color } : { color: "#9ca3af" }}
    title={new Date(playedAt).toLocaleString()}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
    <span>Last played {timeAgo(playedAt, now)}</span>
  </div>
);

const PodcastLabel = ({
  color,
  className = "",
}: {
  color?: string;
  className?: string;
}) => (
  <div
    className={`flex items-center gap-1 text-[11px] leading-none mb-1 ${className}`}
    style={color ? { color } : { color: "#9ca3af" }}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4M8 21h8" />
    </svg>
    <span>Podcast</span>
  </div>
);

const ProgressBar = ({
  progress,
  duration,
  fillColor,
  textColor,
  textClassName = "",
  trackClassName = "bg-white/15",
  label = "Song progress",
  className = "w-full mt-2",
}: {
  progress: number;
  duration: number;
  fillColor?: string;
  textColor?: string;
  textClassName?: string;
  trackClassName?: string;
  label?: string;
  className?: string;
}) => {
  const percent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className={`${className} flex flex-col gap-1`}>
      <div
        className={`w-full h-1 rounded-full overflow-hidden ${trackClassName}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={progress}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-linear"
          style={{
            width: `${percent}%`,
            backgroundColor: fillColor || "#1ED760",
          }}
        />
      </div>
      <div
        className={`flex justify-between text-xs tabular-nums leading-none ${textClassName}`}
        style={textColor ? { color: textColor } : undefined}
      >
        <span>{formatDuration(progress)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};

export const AnimatedBars = ({
  color,
  align = "justify-center sm:justify-start",
}: {
  color?: string;
  align?: string;
}) => {
  const bar1 = useRef<HTMLSpanElement>(null);
  const bar2 = useRef<HTMLSpanElement>(null);
  const bar3 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (bar1.current)
      animate(
        bar1.current,
        {
          transform: [
            "scaleY(1.0) translateY(0rem)",
            "scaleY(1.5) translateY(-0.082rem)",
            "scaleY(1.0) translateY(0rem)",
          ],
        },
        {
          duration: 1.0,
          repeat: Infinity,
          ease: "easeInOut",
        },
      );
    if (bar2.current)
      animate(
        bar2.current,
        {
          transform: [
            "scaleY(1.0) translateY(0rem)",
            "scaleY(3) translateY(-0.083rem)",
            "scaleY(1.0) translateY(0rem)",
          ],
        },
        {
          delay: 0.2,
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      );
    if (bar3.current)
      animate(
        bar3.current,
        {
          transform: [
            "scaleY(1.0)  translateY(0rem)",
            "scaleY(0.5) translateY(0.37rem)",
            "scaleY(1.0)  translateY(0rem)",
          ],
        },
        {
          delay: 0.3,
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      );
  }, []);

  const barStyle = color ? { backgroundColor: color } : undefined;
  const barBase = "w-1 mr-[3px]";

  return (
    <div className={`w-full flex ${align}`}>
      <div className="w-auto flex items-end overflow-hidden">
        <span
          ref={bar1}
          className={`${barBase} h-2 opacity-75 ${color ? "" : "bg-primary"}`}
          style={barStyle}
        />
        <span
          ref={bar2}
          className={`${barBase} h-1 ${color ? "" : "bg-primary"}`}
          style={barStyle}
        />
        <span
          ref={bar3}
          className={`w-1 h-3 opacity-80 ${color ? "" : "bg-primary"}`}
          style={barStyle}
        />
      </div>
    </div>
  );
};

/**
 * variant "card": the original stacked card used in the site footer.
 * variant "compact": same layout, tighter padding, smaller art, and a wider
 * text column so the progress bar can stretch. Used on the Listen page.
 */
const NowPlaying = ({ variant = "card" }: { variant?: "card" | "compact" }) => {
  const compact = variant === "compact";
  const { data, error, isLoading, mutate } = useNowPlaying();

  // Only an actively playing song colors the card and the page accents.
  // Paused and last-played states keep the art and text but drop back to
  // the neutral look so the site doesn't read as "playing".
  const isActive = data?.isPlaying === true;
  const colorPalette = isActive ? data?.palette : undefined;
  const { progress, duration } = useSongProgress(data, mutate);

  useEffect(() => {
    const accent = colorPalette?.vibrant || colorPalette?.muted;
    if (accent) {
      document.documentElement.style.setProperty(
        "--now-playing-accent",
        accent,
      );
      // Unregistered twin: absent when idle so CSS var() fallbacks work.
      document.documentElement.style.setProperty("--accent-ui", accent);
    } else {
      document.documentElement.style.removeProperty("--now-playing-accent");
      document.documentElement.style.removeProperty("--accent-ui");
    }
  }, [colorPalette]);

  if (isLoading && compact) {
    return (
      <div className="flex mt-2 justify-center w-full">
        <div className="flex w-full max-w-lg items-center gap-3 rounded-lg bg-[#191414] p-3 shadow-card">
          <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded bg-[#2b2828]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-[#2b2828]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#2b2828]" />
            <div className="h-1 w-full animate-pulse rounded bg-[#2b2828]" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex mt-2 justify-center w-full">
        <div className="transition-colors duration-700 p-4 rounded-lg inline-flex justify-center flex-col items-center sm:flex-row gap-3 shadow-card bg-[#191414]">
          <div className="w-[90px] h-[90px] animate-pulse bg-[#2b2828] rounded" />
          <div className="max-w-xs flex flex-col gap-2">
            <div className="w-24 h-4 animate-pulse bg-[#2b2828] rounded" />
            <div className="w-32 h-5 animate-pulse bg-[#2b2828] rounded" />
            <div className="w-20 h-4 animate-pulse bg-[#2b2828] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex mt-2 justify-center w-full">
        <div className="p-4 rounded-lg inline-flex justify-center flex-col items-center sm:flex-row gap-3 shadow-card bg-[#191414]">
          <div className="flex justify-center sm:justify-start">
            <svg className="h-7 w-7" viewBox="0 0 168 168">
              <path
                fill="#1ED760"
                d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l.001-.004zm38.404 120.78a5.217 5.217 0 01-7.18 1.73c-19.662-12.01-44.414-14.73-73.564-8.07a5.222 5.222 0 01-6.249-3.93 5.213 5.213 0 013.926-6.25c31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-.903-8.148-4.35a6.538 6.538 0 014.354-8.143c30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219a7.835 7.835 0 015.221-9.771c29.581-8.98 78.756-7.245 109.83 11.202a7.823 7.823 0 012.74 10.733c-2.2 3.722-7.02 4.949-10.73 2.739z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Could not load Spotify data</p>
        </div>
      </div>
    );
  }

  const vibrant = colorPalette?.vibrant;
  const isEpisode = data?.type === "episode";
  const lastPlayedAt = !data?.isPlaying ? data?.playedAt : undefined;
  // The stacked card centers its status row on phones; the compact row does not.
  const statusAlign = compact
    ? "justify-start"
    : "justify-center sm:justify-start";

  // Backdrop needs artwork; without it (nothing playing at all) fall back to
  // the classic dark card so the empty state still has a surface.
  const isBackdrop = CARD_STYLE === "backdrop" && Boolean(data?.albumImageUrl);
  const isFloat = CARD_STYLE === "float";
  const isClassic = !isBackdrop && !isFloat;

  // Text colors per style. Float uses theme classes so it works on both
  // light and dark pages; the other two sit on a dark surface.
  const artistBase = colorPalette?.lightMuted || colorPalette?.lightVibrant;
  const classicMuted = artistBase ? mixWithWhite(artistBase, 0.4) : "#9ca3af";
  const titleColor = isBackdrop
    ? "#ffffff"
    : isClassic
      ? colorPalette?.lightVibrant || "var(--secondary-light)"
      : undefined;
  const mutedColor = isBackdrop
    ? "rgba(255,255,255,0.72)"
    : isClassic
      ? classicMuted
      : undefined;
  const titleClass = isFloat ? "text-text" : "";
  const mutedClass = isFloat ? "text-gray-700 dark:text-gray-300" : "";
  const fillColor = isBackdrop ? "#ffffff" : vibrant;
  const trackClass = isFloat ? "bg-black/10 dark:bg-white/15" : "bg-white/15";

  // Surface per style.
  const layout = compact
    ? "flex w-full max-w-lg flex-row items-center gap-3"
    : "inline-flex flex-col items-center sm:flex-row gap-3";
  const surfaceClass = isFloat
    ? `${layout} p-2`
    : isBackdrop
      ? `${layout} relative overflow-hidden rounded-xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.25)]`
      : `${layout} border rounded-lg bg-origin-border bg-no-repeat p-3 shadow-card`;
  const surfaceStyle: CSSProperties | undefined = isClassic
    ? {
        backgroundColor: colorPalette?.muted || "#191414",
        backgroundImage: `linear-gradient(${
          colorPalette?.muted || "#191414"
        }, #191414 100%)`,
        borderColor: "transparent",
        boxShadow: vibrant ? `0 4px 24px ${vibrant}20` : undefined,
      }
    : undefined;

  // Art treatment per style.
  const artSize = compact ? 72 : 90;
  const artShadow = isFloat
    ? vibrant
      ? `0 10px 28px ${vibrant}70`
      : "0 6px 18px rgba(0,0,0,0.25)"
    : isBackdrop
      ? "0 6px 18px rgba(0,0,0,0.45)"
      : vibrant
        ? `0 2px 12px ${vibrant}40`
        : undefined;
  const artRadius = isClassic ? "rounded" : "rounded-lg";

  return (
    <div className="flex mt-2 justify-center w-full">
      <div
        style={surfaceStyle}
        className={`transition-all duration-700 ${surfaceClass}`}
      >
        {isBackdrop && data?.albumImageUrl && (
          <>
            <Image
              src={data.albumImageUrl}
              alt=""
              aria-hidden
              fill
              sizes="640px"
              className={`object-cover scale-125 blur-2xl saturate-150 transition-[filter] duration-700 ${
                lastPlayedAt ? "grayscale" : ""
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f14]/45 to-[#0f0f14]/70" />
          </>
        )}
        {data?.albumImageUrl ? (
          <div
            className={`relative flex shrink-0 overflow-hidden ${artRadius}`}
            style={{ boxShadow: artShadow }}
          >
            <Image
              src={data.albumImageUrl}
              alt={data.album}
              className={`transition-[filter] duration-700 ${
                lastPlayedAt ? "grayscale" : ""
              }`}
              width={artSize}
              height={artSize}
              loading="eager"
            />
          </div>
        ) : (
          <div
            className={`relative animate-pulse rounded bg-[#2b2828] ${
              compact ? "h-[72px] w-[72px]" : "h-[90px] w-[90px]"
            }`}
          />
        )}
        <div
          className={
            compact
              ? "relative flex min-w-0 flex-1 flex-col"
              : "relative max-w-xs min-w-[200px] flex flex-col"
          }
        >
          {data?.songUrl ? (
            lastPlayedAt ? (
              <LastPlayedLabel
                playedAt={lastPlayedAt}
                now={data.receivedAt}
                color={mutedColor}
                className={`${mutedClass} ${statusAlign}`}
              />
            ) : isEpisode ? (
              <PodcastLabel
                color={mutedColor}
                className={`${mutedClass} ${statusAlign}`}
              />
            ) : (
              <div>
                <AnimatedBars color={vibrant} align={statusAlign} />
              </div>
            )
          ) : (
            <div className={`flex mb-1 ${statusAlign}`}>
              <svg className="h-7 w-7" viewBox="0 0 168 168">
                <path
                  fill="#1ED760"
                  d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l.001-.004zm38.404 120.78a5.217 5.217 0 01-7.18 1.73c-19.662-12.01-44.414-14.73-73.564-8.07a5.222 5.222 0 01-6.249-3.93 5.213 5.213 0 013.926-6.25c31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-.903-8.148-4.35a6.538 6.538 0 014.354-8.143c30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219a7.835 7.835 0 015.221-9.771c29.581-8.98 78.756-7.245 109.83 11.202a7.823 7.823 0 012.74 10.733c-2.2 3.722-7.02 4.949-10.73 2.739z"
                />
              </svg>
            </div>
          )}
          {data?.songUrl ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <a
                href={data.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 overflow-hidden"
              >
                <p
                  className={`animated-underline inline-block max-w-full align-top font-medium truncate transition-colors duration-700 ${
                    compact ? "text-base" : "text-lg"
                  } ${titleClass}`}
                  style={titleColor ? { color: titleColor } : undefined}
                >
                  {data.title}
                </p>
              </a>
              {typeof data.popularity === "number" && !lastPlayedAt && (
                <PopularityFlame
                  popularity={data.popularity}
                  palette={colorPalette}
                />
              )}
              {data.explicit && <ExplicitBadge />}
            </div>
          ) : (
            <p
              className={`font-medium truncate text-lg transition-colors duration-700 ${titleClass}`}
              style={titleColor ? { color: titleColor } : undefined}
            >
              Not Playing
            </p>
          )}
          <p
            className={`truncate transition-colors duration-700 ${
              compact ? "text-sm" : ""
            } ${mutedClass}`}
            style={mutedColor ? { color: mutedColor } : undefined}
          >
            {data?.artist ?? "Spotify"}
          </p>
          {data?.songUrl && duration > 0 && (
            <ProgressBar
              progress={progress}
              duration={duration}
              fillColor={fillColor}
              textColor={mutedColor}
              textClassName={mutedClass}
              trackClassName={trackClass}
              label={isEpisode ? "Episode progress" : "Song progress"}
              className={compact ? "w-full mt-1.5" : "w-full mt-2"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;

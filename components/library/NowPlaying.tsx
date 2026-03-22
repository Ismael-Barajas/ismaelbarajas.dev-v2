import useSWR from "swr";
import { useEffect, useRef } from "react";
import { animate } from "motion/mini";
import fetcher from "lib/fetcher";
import Image from "next/image";

interface PaletteColors {
  vibrant?: string;
  muted?: string;
  darkVibrant?: string;
  darkMuted?: string;
  lightVibrant?: string;
  lightMuted?: string;
}

interface NowPlayingSong {
  album: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
  palette?: PaletteColors;
  songUrl: string;
  title: string;
}

const mixWithWhite = (hex: string, weight: number): string => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 0xff) * (1 - weight) + 255 * weight);
  const g = Math.round(((n >> 8) & 0xff) * (1 - weight) + 255 * weight);
  const b = Math.round((n & 0xff) * (1 - weight) + 255 * weight);
  return `rgb(${r},${g},${b})`;
};

const AnimatedBars = ({ color }: { color?: string }) => {
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
    <div className="w-full flex justify-center sm:justify-start">
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

const NowPlaying = () => {
  const { data, error, isLoading } = useSWR<NowPlayingSong>(
    "/api/now-playing",
    fetcher,
    {
      refreshInterval: 10000,
    },
  );

  const colorPalette = data?.palette;

  useEffect(() => {
    const accent = colorPalette?.vibrant || colorPalette?.muted;
    if (accent) {
      document.documentElement.style.setProperty(
        "--now-playing-accent",
        accent,
      );
    }
  }, [colorPalette]);

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

  const border = colorPalette?.darkVibrant;
  const barColor = colorPalette?.vibrant;
  const titleColor = colorPalette?.lightVibrant;
  const artistBase = colorPalette?.lightMuted || colorPalette?.lightVibrant;
  const artistColor = artistBase ? mixWithWhite(artistBase, 0.4) : "#9ca3af";
  const glowColor = colorPalette?.vibrant;

  return (
    <div className="flex mt-2 justify-center w-full">
      <div
        style={{
          backgroundColor: colorPalette?.muted || "#191414",
          backgroundImage: `linear-gradient(${
            colorPalette?.muted || "#191414"
          }, #191414 100%)`,
          borderColor: border || "transparent",
          boxShadow: glowColor ? `0 4px 24px ${glowColor}20` : undefined,
        }}
        className="transition-all duration-700 border p-4 rounded-lg inline-flex justify-center flex-col items-center sm:flex-row truncate gap-3 shadow-card"
      >
        {data?.albumImageUrl ? (
          <div
            className="flex rounded overflow-hidden"
            style={{
              boxShadow: glowColor ? `0 2px 12px ${glowColor}40` : undefined,
            }}
          >
            <Image
              src={data?.albumImageUrl}
              alt={data?.album}
              width={90}
              height={90}
              loading="eager"
            />
          </div>
        ) : (
          <div className="w-[90px] h-[90px] animate-pulse bg-[#2b2828] rounded" />
        )}
        <div className="max-w-xs flex flex-col">
          {data?.songUrl ? (
            <div>
              <AnimatedBars color={barColor} />
            </div>
          ) : (
            <div className="flex justify-center sm:justify-start mb-1">
              <svg className="h-7 w-7" viewBox="0 0 168 168">
                <path
                  fill="#1ED760"
                  d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l.001-.004zm38.404 120.78a5.217 5.217 0 01-7.18 1.73c-19.662-12.01-44.414-14.73-73.564-8.07a5.222 5.222 0 01-6.249-3.93 5.213 5.213 0 013.926-6.25c31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-.903-8.148-4.35a6.538 6.538 0 014.354-8.143c30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219a7.835 7.835 0 015.221-9.771c29.581-8.98 78.756-7.245 109.83 11.202a7.823 7.823 0 012.74 10.733c-2.2 3.722-7.02 4.949-10.73 2.739z"
                />
              </svg>
            </div>
          )}
          {data?.songUrl ? (
            <a href={data.songUrl} target="_blank" rel="noopener noreferrer">
              <p
                className="animated-underline font-medium truncate text-lg w-fit transition-colors duration-700"
                style={{ color: titleColor || "var(--secondary-light)" }}
              >
                {data.title}
              </p>
            </a>
          ) : (
            <p
              className="font-medium truncate text-lg transition-colors duration-700"
              style={{ color: titleColor || "var(--secondary-light)" }}
            >
              Not Playing
            </p>
          )}
          <p
            className="truncate transition-colors duration-700"
            style={{ color: artistColor || "#d1d5db" }}
          >
            {data?.artist ?? "Spotify"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;

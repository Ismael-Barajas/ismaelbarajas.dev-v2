import { useId } from "react";
import { mixHex, mixWithWhite } from "lib/color";
import type { PaletteColors } from "lib/nowPlayingFetcher";

/**
 * Color source for the popularity flame.
 *  - "palette": ember takes the album art's vibrant color, matching the bars.
 *  - "fire":    fixed orange-to-red heat scale regardless of album art.
 */
export const FLAME_MODE: "palette" | "fire" = "fire";

const FLAME_PATH =
  "M12 2c.3 4.2-5.5 6.6-5.5 12a5.5 5.5 0 0 0 11 0c0-2.3-1-4.1-2.2-5.6-.3 1.7-1.2 3-2.4 3.5.9-2.8.2-7-0.9-9.9z";
const FLAME_CORE_PATH =
  "M12 12.5c.3 2-2.2 3-2.2 5.2a2.2 2.2 0 0 0 4.4 0c0-1.2-.6-2.1-1.1-2.9-.2.8-.6 1.4-1.1 1.6.4-1.3.2-2.9 0-3.9z";

/**
 * A flame whose lit portion rises with Spotify's 0-100 popularity score.
 * The core brightens toward white as the score climbs so a 100 reads hotter
 * than a 60 whatever hue the ember is.
 */
const PopularityFlame = ({
  popularity,
  palette,
  mode = FLAME_MODE,
  size = 18,
  showScore = false,
}: {
  popularity: number;
  palette?: PaletteColors;
  mode?: "palette" | "fire";
  size?: number;
  /** Render the numeric score next to the flame. */
  showScore?: boolean;
}) => {
  const clipId = useId();
  const score = Math.max(0, Math.min(100, popularity));
  const t = score / 100;
  const litHeight = 24 * t;

  let body: string;
  let coreBase: string;
  if (mode === "fire" || !palette?.vibrant) {
    body = mixHex("#EF9F27", "#E24B4A", t);
    coreBase = "#FAC775";
  } else {
    body = palette.vibrant;
    coreBase = palette.lightVibrant || palette.vibrant;
  }
  const core = mixWithWhite(coreBase, 0.15 + 0.7 * t);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      title={`Popularity ${score} / 100`}
      aria-label={`Popularity ${score} out of 100`}
      role="img"
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y={24 - litHeight} width="24" height={litHeight} />
          </clipPath>
        </defs>
        <path d={FLAME_PATH} fill="currentColor" opacity="0.18" />
        <g clipPath={`url(#${clipId})`}>
          <path
            d={FLAME_PATH}
            fill={body}
            className="transition-colors duration-700"
          />
          <path
            d={FLAME_CORE_PATH}
            fill={core}
            className="transition-colors duration-700"
          />
        </g>
      </svg>
      {showScore && <span className="tabular-nums text-xs">{score}</span>}
    </span>
  );
};

export default PopularityFlame;

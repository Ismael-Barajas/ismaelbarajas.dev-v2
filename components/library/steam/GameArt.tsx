import { useState } from "react";
import Image from "next/image";
import { FiMonitor } from "react-icons/fi";
import type { SteamGame } from "lib/steam";

/**
 * Steam's 460x215 header art in a fixed-ratio box, or a plain tile when there
 * is none: non-Steam shortcuts have no art, and a few titles 404 on the CDN.
 * `decorative` is for rows where the game name sits right next to the art.
 */
const GameArt = ({
  game,
  sizes,
  decorative = false,
  priority = false,
  className = "",
}: {
  game: Pick<SteamGame, "name" | "headerUrl">;
  sizes: string;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const showImage = game.headerUrl !== null && !failed;

  return (
    <div
      className={`relative aspect-[460/215] overflow-hidden rounded bg-[#2b2828] ${className}`}
    >
      {showImage ? (
        <Image
          src={game.headerUrl as string}
          alt={decorative ? "" : game.name}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center gap-2 bg-gradient-to-br from-[#2b2828] to-[#191414] px-2 text-gray-300"
          aria-hidden={decorative || undefined}
        >
          <FiMonitor className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!decorative && (
            <span className="truncate text-sm font-medium">{game.name}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default GameArt;

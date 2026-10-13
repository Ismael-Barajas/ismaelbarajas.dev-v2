import Image from "next/image";
import { FiUser } from "react-icons/fi";
import type { SteamPresence } from "lib/steamPresenceFetcher";
import { formatLastSeen } from "lib/steam/format";
import GameArt from "./GameArt";
import SteamStatusDot, { STEAM_STATUS_COLORS } from "./SteamStatusDot";

const AVATAR = 56;
const ART_SIZES = "(max-width: 640px) 90vw, 488px";

const StatusLine = ({ presence }: { presence: SteamPresence }) => {
  const muted = "flex items-center gap-2 text-sm text-white/70";

  switch (presence.state) {
    case "playing":
      return (
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: STEAM_STATUS_COLORS.playing }}
        >
          <SteamStatusDot status="playing" />
          <span className="truncate">
            Playing <span className="font-medium">{presence.game?.name}</span>
          </span>
        </div>
      );
    case "online":
      return (
        <div className={muted} style={{ color: STEAM_STATUS_COLORS.online }}>
          <SteamStatusDot status="online" />
          <span>Online</span>
        </div>
      );
    case "offline":
      return (
        <div className={muted}>
          <SteamStatusDot status="offline" />
          <span>
            Offline
            {presence.lastSeen !== undefined &&
              ` · last seen ${formatLastSeen(presence.lastSeen)}`}
          </span>
        </div>
      );
    default:
      return (
        <div className={muted}>
          <SteamStatusDot status="offline" />
          <span>Status unavailable</span>
        </div>
      );
  }
};

const Avatar = ({ src }: { src?: string }) =>
  src ? (
    <Image
      src={src}
      alt=""
      width={AVATAR}
      height={AVATAR}
      className="rounded-lg"
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-lg bg-[#2b2828] text-gray-400"
      style={{ width: AVATAR, height: AVATAR }}
      aria-hidden="true"
    >
      <FiUser className="h-6 w-6" />
    </div>
  );

/**
 * Steam presence for the /play page. `presence` is undefined until the first
 * response. The page handles `disabled` itself, so it never reaches here.
 * The glow uses --steam-accent, which the page scopes to its wrapper.
 */
const PresenceCard = ({ presence }: { presence?: SteamPresence }) => {
  if (!presence) {
    return (
      <div className="flex mt-2 justify-center w-full">
        <div className="flex w-full max-w-lg items-center gap-3 rounded-xl bg-[#191414] p-3 shadow-card">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-[#2b2828] motion-reduce:animate-none" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#2b2828] motion-reduce:animate-none" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#2b2828] motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    );
  }

  const { game, persona, profileUrl } = presence;
  const playing = presence.state === "playing" && game !== undefined;

  return (
    <div className="flex mt-2 justify-center w-full">
      <div className="relative flex w-full max-w-lg flex-col gap-3 overflow-hidden rounded-xl bg-[#191414] p-3 shadow-[0_12px_32px_var(--steam-accent,rgba(0,0,0,0.25))] transition-shadow duration-700">
        {playing && game.headerUrl && (
          <>
            <Image
              src={game.headerUrl}
              alt=""
              aria-hidden
              fill
              sizes="512px"
              className="object-cover scale-125 blur-2xl saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f14]/45 to-[#0f0f14]/70" />
          </>
        )}
        <div className="relative flex items-center gap-3">
          {/* The name link below carries the label; this one is a mouse
              convenience, so it stays out of the tab order. */}
          {profileUrl ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden="true"
              className="shrink-0"
            >
              <Avatar src={presence.avatarUrl} />
            </a>
          ) : (
            <div className="shrink-0">
              <Avatar src={presence.avatarUrl} />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${persona ?? "Steam profile"} on Steam`}
                className="min-w-0"
              >
                <p className="animated-underline inline-block max-w-full align-top truncate text-base font-medium text-white">
                  {persona ?? "Steam"}
                </p>
              </a>
            ) : (
              <p className="truncate text-base font-medium text-white">
                {persona ?? "Steam"}
              </p>
            )}
            <StatusLine presence={presence} />
          </div>
        </div>
        {playing &&
          (game.storeUrl ? (
            <a
              key={game.appId ?? game.name}
              href={game.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block rounded shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
            >
              <GameArt game={game} sizes={ART_SIZES} priority />
            </a>
          ) : (
            <GameArt
              key={game.name}
              game={game}
              sizes={ART_SIZES}
              className="relative shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
            />
          ))}
      </div>
    </div>
  );
};

export default PresenceCard;

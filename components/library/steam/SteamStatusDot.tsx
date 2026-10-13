/** Steam's own status colors, so the dot reads the way it does in the client. */
export const STEAM_STATUS_COLORS = {
  playing: "#90ba3c",
  online: "#57cbde",
  offline: "#898989",
} as const;

type Status = keyof typeof STEAM_STATUS_COLORS;

/**
 * A status dot. "playing" pulses (a ping ring behind a solid dot) rather than
 * reusing the music bars, which made a game read like a song.
 */
const SteamStatusDot = ({ status }: { status: Status }) => {
  const color = STEAM_STATUS_COLORS[status];

  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      {status === "playing" && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
};

export default SteamStatusDot;

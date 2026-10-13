import type { SteamGame } from "lib/steam";
import { formatPlaytime } from "lib/steam/format";
import GameArt from "./GameArt";

type Variant = "top" | "lately";

const GameName = ({ game }: { game: SteamGame }) => {
  // Non-Steam shortcuts have no store page.
  if (!game.storeUrl) {
    return <p className="truncate font-medium text-text">{game.name}</p>;
  }
  return (
    <a href={game.storeUrl} target="_blank" rel="noopener noreferrer">
      <p className="animated-underline w-fit max-w-full truncate font-medium text-text">
        {game.name}
      </p>
    </a>
  );
};

const GameRow = ({
  game,
  rank,
  variant,
}: {
  game: SteamGame;
  rank: number;
  variant: Variant;
}) => (
  <li className="flex w-full items-center gap-3 border-b border-gray-800 py-2.5 dark:border-gray-200">
    {variant === "top" && (
      <span className="w-6 text-right text-sm font-medium tabular-nums text-gray-500 dark:text-gray-400">
        {rank}
      </span>
    )}
    <GameArt game={game} sizes="96px" decorative className="w-24 shrink-0" />
    <div className="min-w-0 flex-1">
      <GameName game={game} />
      {variant === "lately" && (
        <p className="truncate text-sm tabular-nums text-gray-500 dark:text-gray-400">
          <span className="font-medium text-text">
            {formatPlaytime(game.playtime2Weeks ?? 0)}
          </span>{" "}
          past 2 weeks · {formatPlaytime(game.playtimeForever ?? 0)} total
        </p>
      )}
    </div>
    {variant === "top" && (
      <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {formatPlaytime(game.playtimeForever ?? 0)}
      </span>
    )}
  </li>
);

/** A titled list of games. Renders nothing when there are none. */
const GameList = ({
  title,
  games,
  variant,
}: {
  title: string;
  games: SteamGame[];
  variant: Variant;
}) => {
  if (games.length === 0) return null;

  return (
    <section aria-label={title}>
      <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold text-text">
        <span
          className="h-5 w-1 rounded-full"
          style={{ backgroundColor: "var(--steam-accent, var(--accent-ui))" }}
          aria-hidden="true"
        />
        {title}
      </h2>
      <ol className="flex flex-col">
        {games.map((game, i) => (
          <GameRow
            key={game.appId ?? game.name}
            game={game}
            rank={i + 1}
            variant={variant}
          />
        ))}
      </ol>
    </section>
  );
};

export default GameList;

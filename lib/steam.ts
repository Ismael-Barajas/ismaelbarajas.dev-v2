import type { PaletteColors } from "lib/nowPlayingFetcher";
import { HIDDEN_APP_IDS, LATELY_N, TOP_N } from "lib/steam/config";

const PLAYER_SUMMARIES_ENDPOINT = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`;
const OWNED_GAMES_ENDPOINT = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`;

/** Raw player from GetPlayerSummaries. Only the fields we read. */
export interface SteamPlayer {
  steamid: string;
  personaname?: string;
  profileurl?: string;
  avatarfull?: string;
  /** 0 offline, 1 online, 2 busy, 3 away, 4 snooze, 5 looking to trade, 6 looking to play. */
  personastate: number;
  /** Unix seconds. Only present when the profile is public. */
  lastlogoff?: number;
  /** App ID as a string. Non-Steam shortcuts report a 64-bit ID instead. */
  gameid?: string;
  /** Name of the game being played, Steam or not. */
  gameextrainfo?: string;
}

/** Raw game from GetOwnedGames with include_appinfo=1. Playtime in minutes. */
export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  /** Absent when the game wasn't played in the past two weeks. */
  playtime_2weeks?: number;
}

export interface SteamGame {
  /** null for non-Steam shortcuts, which have no store page or art. */
  appId: number | null;
  name: string;
  headerUrl: string | null;
  storeUrl: string | null;
  /** Minutes. Only set on library entries. */
  playtimeForever?: number;
  /** Minutes in the past two weeks. Only set on library entries. */
  playtime2Weeks?: number;
}

/**
 * - playing: in a game that isn't hidden.
 * - online: any online persona state (busy, away, ...), or playing a hidden game.
 * - offline: signed out or invisible.
 * - unavailable: Steam couldn't be reached and nothing was cached.
 * - disabled: client-side only. The fetcher returns it when the route 404s
 *   because STEAM_API_KEY / STEAM_ID aren't set; render nothing.
 */
export type SteamPresenceState =
  | "playing"
  | "online"
  | "offline"
  | "unavailable"
  | "disabled";

export interface SteamPresence {
  state: SteamPresenceState;
  /** Only when state is "playing". */
  game?: SteamGame;
  /** Unix seconds of the last sign-off. Only when state is "offline". */
  lastSeen?: number;
  persona?: string;
  avatarUrl?: string;
  profileUrl?: string;
  /** Colors from the game's header art. Only when playing a Steam game. */
  palette?: PaletteColors;
}

export interface SteamLibrary {
  top: SteamGame[];
  lately: SteamGame[];
}

export const isSteamConfigured = (): boolean =>
  Boolean(process.env.STEAM_API_KEY && process.env.STEAM_ID);

const getCredentials = () => {
  const { STEAM_API_KEY, STEAM_ID } = process.env;

  if (!STEAM_API_KEY || !STEAM_ID) {
    throw new Error("Missing Steam environment variables");
  }

  return { key: STEAM_API_KEY, steamId: STEAM_ID };
};

/** Returns the raw response so callers can read status and Retry-After. */
export const getPlayerSummary = async () => {
  const { key, steamId } = getCredentials();
  const params = new URLSearchParams({ key, steamids: steamId });
  return fetch(`${PLAYER_SUMMARIES_ENDPOINT}?${params}`);
};

/**
 * Requires the profile's Game details to be public. Without
 * include_played_free_games, Steam drops free-to-play titles even when they
 * have hours logged.
 */
export const getOwnedGames = async () => {
  const { key, steamId } = getCredentials();
  const params = new URLSearchParams({
    key,
    steamid: steamId,
    include_appinfo: "1",
    include_played_free_games: "1",
  });
  return fetch(`${OWNED_GAMES_ENDPOINT}?${params}`);
};

export const steamHeaderUrl = (appId: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

export const steamStoreUrl = (appId: number) =>
  `https://store.steampowered.com/app/${appId}`;

/**
 * Real app IDs fit in 32 bits. Non-Steam shortcuts get a 64-bit game ID
 * derived from the shortcut, which has no store page or art.
 */
const parseAppId = (gameid?: string): number | null => {
  if (!gameid || !/^\d+$/.test(gameid)) return null;
  const id = Number(gameid);
  return id > 0 && id < 2 ** 32 ? id : null;
};

/** Maps a GetPlayerSummaries player to the three states the site shows. */
export const toPresence = (
  player: SteamPlayer,
  hidden: readonly number[] = HIDDEN_APP_IDS,
): SteamPresence => {
  const profile = {
    ...(player.personaname !== undefined && { persona: player.personaname }),
    ...(player.avatarfull !== undefined && { avatarUrl: player.avatarfull }),
    ...(player.profileurl !== undefined && { profileUrl: player.profileurl }),
  };

  if (player.personastate === 0) {
    return {
      state: "offline",
      ...(player.lastlogoff !== undefined && { lastSeen: player.lastlogoff }),
      ...profile,
    };
  }

  // gameextrainfo is the name; without it there's nothing to show.
  if (!player.gameextrainfo) return { state: "online", ...profile };

  const appId = parseAppId(player.gameid);
  if (appId !== null && hidden.includes(appId)) {
    return { state: "online", ...profile };
  }

  return {
    state: "playing",
    game: {
      appId,
      name: player.gameextrainfo,
      headerUrl: appId === null ? null : steamHeaderUrl(appId),
      storeUrl: appId === null ? null : steamStoreUrl(appId),
    },
    ...profile,
  };
};

const toGame = (game: SteamOwnedGame): SteamGame => ({
  appId: game.appid,
  name: game.name,
  headerUrl: steamHeaderUrl(game.appid),
  storeUrl: steamStoreUrl(game.appid),
  playtimeForever: game.playtime_forever ?? 0,
  playtime2Weeks: game.playtime_2weeks ?? 0,
});

/** Descending by the given playtime, then by name so ties stay stable. */
const byPlaytime =
  (key: "playtimeForever" | "playtime2Weeks") => (a: SteamGame, b: SteamGame) =>
    (b[key] ?? 0) - (a[key] ?? 0) || a.name.localeCompare(b.name);

/** Top games by all-time playtime, and what's been played in the past two weeks. */
export const toLibrary = (
  games: SteamOwnedGame[],
  hidden: readonly number[] = HIDDEN_APP_IDS,
): SteamLibrary => {
  const visible = games
    .filter((game) => !hidden.includes(game.appid))
    .map(toGame);

  return {
    top: visible
      .filter((game) => (game.playtimeForever ?? 0) > 0)
      .sort(byPlaytime("playtimeForever"))
      .slice(0, TOP_N),
    lately: visible
      .filter((game) => (game.playtime2Weeks ?? 0) > 0)
      .sort(byPlaytime("playtime2Weeks"))
      .slice(0, LATELY_N),
  };
};

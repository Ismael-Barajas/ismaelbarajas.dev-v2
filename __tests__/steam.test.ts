import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getOwnedGames,
  getPlayerSummary,
  isSteamConfigured,
  steamHeaderUrl,
  steamStoreUrl,
  toLibrary,
  toPresence,
  type SteamOwnedGame,
  type SteamPlayer,
} from "lib/steam";
import { LATELY_N, TOP_N } from "lib/steam/config";
import { formatLastSeen, formatPlaytime } from "lib/steam/format";
import steamPresenceFetcher, {
  STEAM_PRESENCE_REFRESH_MS,
  steamPresenceRefreshInterval,
} from "lib/steamPresenceFetcher";

describe("steam client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STEAM_API_KEY: "test-key",
      STEAM_ID: "76561198000000000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("reports configured only when both env vars are set", () => {
    expect(isSteamConfigured()).toBe(true);
    delete process.env.STEAM_ID;
    expect(isSteamConfigured()).toBe(false);
    process.env.STEAM_ID = "76561198000000000";
    delete process.env.STEAM_API_KEY;
    expect(isSteamConfigured()).toBe(false);
  });

  it("throws when env vars are missing", async () => {
    delete process.env.STEAM_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(getPlayerSummary()).rejects.toThrow(
      "Missing Steam environment variables",
    );
    await expect(getOwnedGames()).rejects.toThrow(
      "Missing Steam environment variables",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("getPlayerSummary fetches GetPlayerSummaries with the key and steamid", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await getPlayerSummary();

    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
    );
    expect(url.searchParams.get("key")).toBe("test-key");
    expect(url.searchParams.get("steamids")).toBe("76561198000000000");
  });

  it("getOwnedGames requests app info and free games", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await getOwnedGames();

    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
    );
    expect(url.searchParams.get("key")).toBe("test-key");
    expect(url.searchParams.get("steamid")).toBe("76561198000000000");
    expect(url.searchParams.get("include_appinfo")).toBe("1");
    expect(url.searchParams.get("include_played_free_games")).toBe("1");
  });
});

describe("toPresence", () => {
  const base: SteamPlayer = {
    steamid: "76561198000000000",
    personaname: "ismael",
    profileurl: "https://steamcommunity.com/id/ismael/",
    avatarfull: "https://avatars.steamstatic.com/abc_full.jpg",
    personastate: 1,
    lastlogoff: 1_700_000_000,
  };

  it("maps personastate 0 to offline with lastSeen from lastlogoff", () => {
    expect(toPresence({ ...base, personastate: 0 })).toEqual({
      state: "offline",
      lastSeen: 1_700_000_000,
      persona: "ismael",
      avatarUrl: "https://avatars.steamstatic.com/abc_full.jpg",
      profileUrl: "https://steamcommunity.com/id/ismael/",
    });
  });

  it("omits lastSeen when Steam does not report lastlogoff", () => {
    const { lastlogoff: _unused, ...noLogoff } = base;
    const presence = toPresence({ ...noLogoff, personastate: 0 });
    expect(presence.state).toBe("offline");
    expect(presence).not.toHaveProperty("lastSeen");
  });

  it.each([1, 2, 3, 4, 5, 6])(
    "collapses personastate %i to online",
    (personastate) => {
      const presence = toPresence({ ...base, personastate });
      expect(presence.state).toBe("online");
      expect(presence.game).toBeUndefined();
      expect(presence.lastSeen).toBeUndefined();
      expect(presence.persona).toBe("ismael");
    },
  );

  it("maps an in-game player to playing with header art and store link", () => {
    const presence = toPresence({
      ...base,
      gameid: "1145360",
      gameextrainfo: "Hades",
    });
    expect(presence.state).toBe("playing");
    expect(presence.game).toEqual({
      appId: 1145360,
      name: "Hades",
      headerUrl:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg",
      storeUrl: "https://store.steampowered.com/app/1145360",
    });
  });

  it("reports playing from any online sub-state (busy, away, ...)", () => {
    const presence = toPresence({
      ...base,
      personastate: 3,
      gameid: "570",
      gameextrainfo: "Dota 2",
    });
    expect(presence.state).toBe("playing");
    expect(presence.game?.appId).toBe(570);
  });

  it("shows a hidden game as plain online with no game info", () => {
    const presence = toPresence(
      { ...base, gameid: "1145360", gameextrainfo: "Hades" },
      [1145360],
    );
    expect(presence.state).toBe("online");
    expect(presence).not.toHaveProperty("game");
  });

  it("treats a non-Steam shortcut (64-bit gameid) as playing without art or store link", () => {
    const presence = toPresence({
      ...base,
      gameid: "13808553434592411648",
      gameextrainfo: "Minecraft",
    });
    expect(presence.state).toBe("playing");
    expect(presence.game).toEqual({
      appId: null,
      name: "Minecraft",
      headerUrl: null,
      storeUrl: null,
    });
  });

  it("treats gameextrainfo without a gameid as a shortcut", () => {
    const presence = toPresence({ ...base, gameextrainfo: "Some Emulator" });
    expect(presence.state).toBe("playing");
    expect(presence.game).toMatchObject({ appId: null, name: "Some Emulator" });
  });

  it("is online, not playing, when a gameid has no game name", () => {
    const presence = toPresence({ ...base, gameid: "570" });
    expect(presence.state).toBe("online");
    expect(presence.game).toBeUndefined();
  });

  it("ignores in-game info while offline", () => {
    const presence = toPresence({
      ...base,
      personastate: 0,
      gameid: "570",
      gameextrainfo: "Dota 2",
    });
    expect(presence.state).toBe("offline");
    expect(presence.game).toBeUndefined();
  });
});

describe("steam URLs", () => {
  it("builds header art and store URLs from an app id", () => {
    expect(steamHeaderUrl(620)).toBe(
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/header.jpg",
    );
    expect(steamStoreUrl(620)).toBe("https://store.steampowered.com/app/620");
  });
});

describe("toLibrary", () => {
  const game = (
    appid: number,
    playtime_forever: number,
    playtime_2weeks?: number,
  ): SteamOwnedGame => ({
    appid,
    name: `Game ${appid}`,
    playtime_forever,
    ...(playtime_2weeks !== undefined ? { playtime_2weeks } : {}),
  });

  it("sorts top games by all-time playtime and maps them to SteamGame", () => {
    const { top } = toLibrary([game(1, 10), game(2, 500, 30), game(3, 120)], []);
    expect(top.map((g) => g.appId)).toEqual([2, 3, 1]);
    expect(top[0]).toEqual({
      appId: 2,
      name: "Game 2",
      headerUrl: steamHeaderUrl(2),
      storeUrl: steamStoreUrl(2),
      playtimeForever: 500,
      playtime2Weeks: 30,
    });
    expect(top[1].playtime2Weeks).toBe(0);
  });

  it(`limits top to ${TOP_N} and lately to ${LATELY_N}`, () => {
    const games = Array.from({ length: 12 }, (_, i) => game(i + 1, (i + 1) * 60, i + 1));
    const { top, lately } = toLibrary(games, []);
    expect(top).toHaveLength(TOP_N);
    expect(lately).toHaveLength(LATELY_N);
    expect(top[0].appId).toBe(12);
    expect(lately[0].appId).toBe(12);
  });

  it("excludes never-played games from top", () => {
    const { top } = toLibrary([game(1, 0), game(2, 5)], []);
    expect(top.map((g) => g.appId)).toEqual([2]);
  });

  it("builds lately from games played in the last two weeks, by recent playtime", () => {
    const { lately } = toLibrary(
      [game(1, 1000, 5), game(2, 50, 40), game(3, 900), game(4, 10, 0)],
      [],
    );
    expect(lately.map((g) => g.appId)).toEqual([2, 1]);
  });

  it("drops hidden games from both lists", () => {
    const { top, lately } = toLibrary([game(1, 1000, 50), game(2, 10, 5)], [1]);
    expect(top.map((g) => g.appId)).toEqual([2]);
    expect(lately.map((g) => g.appId)).toEqual([2]);
  });

  it("breaks playtime ties by name so the order is stable", () => {
    const a = { ...game(1, 100, 10), name: "Beta" };
    const b = { ...game(2, 100, 10), name: "Alpha" };
    const { top, lately } = toLibrary([a, b], []);
    expect(top.map((g) => g.name)).toEqual(["Alpha", "Beta"]);
    expect(lately.map((g) => g.name)).toEqual(["Alpha", "Beta"]);
  });

  it("returns empty lists for an empty library", () => {
    expect(toLibrary([], [])).toEqual({ top: [], lately: [] });
  });
});

describe("formatPlaytime", () => {
  it.each([
    [0, "0 min"],
    [42, "42 min"],
    [59, "59 min"],
    [60, "1.0 h"],
    [258, "4.3 h"],
    [594, "9.9 h"],
    [598, "10 h"],
    [600, "10 h"],
    [20_400, "340 h"],
    [74_040, "1,234 h"],
    [-5, "0 min"],
    [Number.NaN, "0 min"],
  ])("formats %s minutes as %s", (minutes, expected) => {
    expect(formatPlaytime(minutes)).toBe(expected);
  });
});

describe("formatLastSeen", () => {
  const now = 1_700_000_000_000;
  const ago = (seconds: number) => Math.floor(now / 1000) - seconds;

  it.each([
    [0, "just now"],
    [59, "just now"],
    [60, "1m ago"],
    [5 * 60 + 30, "5m ago"],
    [59 * 60 + 59, "59m ago"],
    [3600, "1h ago"],
    [3 * 3600 + 1800, "3h ago"],
    [23 * 3600 + 3599, "23h ago"],
    [86_400, "1d ago"],
    [2 * 86_400 + 3600, "2d ago"],
    [29 * 86_400, "29d ago"],
    [30 * 86_400, "1mo ago"],
    [364 * 86_400, "12mo ago"],
    [365 * 86_400, "1y ago"],
    [3 * 365 * 86_400, "3y ago"],
  ])("formats %s seconds ago as %s", (seconds, expected) => {
    expect(formatLastSeen(ago(seconds), now)).toBe(expected);
  });

  it("treats a timestamp in the future as just now", () => {
    expect(formatLastSeen(ago(-120), now)).toBe("just now");
  });

  it("defaults now to the current clock", () => {
    expect(formatLastSeen(Math.floor(Date.now() / 1000) - 120)).toBe("2m ago");
  });
});

describe("steamPresenceFetcher", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the presence payload on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ state: "online", persona: "ismael" }), {
        status: 200,
      }),
    );
    expect(await steamPresenceFetcher("/api/steam/presence")).toEqual({
      state: "online",
      persona: "ismael",
    });
  });

  it("maps a 404 to disabled (feature not configured)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "x" }), { status: 404 }),
    );
    expect(await steamPresenceFetcher("/x")).toEqual({ state: "disabled" });
  });

  it("maps other failures and network errors to unavailable", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: "unavailable" }), { status: 502 }),
      )
      .mockResolvedValueOnce(new Response("<html>", { status: 200 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await steamPresenceFetcher("/x")).toEqual({ state: "unavailable" });
    expect(await steamPresenceFetcher("/x")).toEqual({ state: "unavailable" });
    expect(await steamPresenceFetcher("/x")).toEqual({ state: "unavailable" });
  });

  it("stops polling once the feature is known to be disabled", () => {
    expect(steamPresenceRefreshInterval(undefined)).toBe(STEAM_PRESENCE_REFRESH_MS);
    expect(steamPresenceRefreshInterval({ state: "online" })).toBe(
      STEAM_PRESENCE_REFRESH_MS,
    );
    expect(steamPresenceRefreshInterval({ state: "unavailable" })).toBe(
      STEAM_PRESENCE_REFRESH_MS,
    );
    expect(steamPresenceRefreshInterval({ state: "disabled" })).toBe(0);
    expect(STEAM_PRESENCE_REFRESH_MS).toBe(10_000);
  });
});

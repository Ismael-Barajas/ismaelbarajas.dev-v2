import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const vibrant = vi.hoisted(() => ({
  from: vi.fn(),
  getPalette: vi.fn(),
}));
vi.mock("node-vibrant/node", () => ({
  Vibrant: {
    from: (url: string) => {
      vibrant.from(url);
      return { getPalette: vibrant.getPalette };
    },
  },
}));

// Only the network edges are mocked; the pure mappers run for real.
const steam = vi.hoisted(() => ({
  isSteamConfigured: vi.fn(),
  getPlayerSummary: vi.fn(),
  getOwnedGames: vi.fn(),
}));
vi.mock("lib/steam", async (importOriginal) => ({
  ...(await importOriginal<typeof import("lib/steam")>()),
  ...steam,
}));

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

function mockRes() {
  const res: any = { headers: {} as Record<string, string> };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn((k: string, v: string) => {
    res.headers[k] = v;
    return res;
  });
  return res;
}

const player = (overrides: Record<string, unknown> = {}) => ({
  steamid: "76561198000000000",
  personaname: "ismael",
  profileurl: "https://steamcommunity.com/id/ismael/",
  avatarfull: "https://avatars.steamstatic.com/abc_full.jpg",
  personastate: 1,
  lastlogoff: 1_700_000_000,
  ...overrides,
});

const summary = (overrides: Record<string, unknown> = {}) =>
  jsonResponse({ response: { players: [player(overrides)] } });

const HADES_HEADER =
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg";

describe("GET /api/steam/presence", () => {
  let handler: (req: any, res: any) => Promise<unknown>;
  let isAllowedImageUrl: (url: string) => boolean;

  beforeEach(async () => {
    vi.resetModules();
    steam.isSteamConfigured.mockReset().mockReturnValue(true);
    steam.getPlayerSummary.mockReset();
    vibrant.from.mockReset();
    vibrant.getPalette.mockReset().mockResolvedValue({
      Vibrant: { hex: "#ff0000" },
      Muted: { hex: "#00ff00" },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mod = await import("../pages/api/steam/presence");
    handler = mod.default;
    isAllowedImageUrl = mod.isAllowedImageUrl;
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects non-GET with 405", async () => {
    const res = mockRes();
    await handler({ method: "POST" }, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.headers.Allow).toBe("GET");
    expect(steam.getPlayerSummary).not.toHaveBeenCalled();
  });

  it("returns 404 when Steam is not configured", async () => {
    steam.isSteamConfigured.mockReturnValue(false);
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(steam.getPlayerSummary).not.toHaveBeenCalled();
  });

  it("serves online presence with a short CDN cache and no stale-while-revalidate", async () => {
    steam.getPlayerSummary.mockResolvedValue(summary());
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.headers["Cache-Control"]).toBe("public, s-maxage=10");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      state: "online",
      persona: "ismael",
      avatarUrl: "https://avatars.steamstatic.com/abc_full.jpg",
      profileUrl: "https://steamcommunity.com/id/ismael/",
    });
    expect(vibrant.from).not.toHaveBeenCalled();
  });

  it("serves offline presence with lastSeen", async () => {
    steam.getPlayerSummary.mockResolvedValue(summary({ personastate: 0 }));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ state: "offline", lastSeen: 1_700_000_000 }),
    );
  });

  it("adds a palette from the header art while playing", async () => {
    steam.getPlayerSummary.mockResolvedValue(
      summary({ gameid: "1145360", gameextrainfo: "Hades" }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(vibrant.from).toHaveBeenCalledWith(HADES_HEADER);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "playing",
        game: expect.objectContaining({ appId: 1145360, name: "Hades" }),
        palette: expect.objectContaining({ vibrant: "#ff0000", muted: "#00ff00" }),
      }),
    );
  });

  it("memoizes the palette per app id", async () => {
    steam.getPlayerSummary.mockImplementation(async () =>
      summary({ gameid: "1145360", gameextrainfo: "Hades" }),
    );
    await handler({ method: "GET" }, mockRes());
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(vibrant.getPalette).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ palette: expect.objectContaining({ vibrant: "#ff0000" }) }),
    );
  });

  it("still serves presence when palette extraction fails", async () => {
    vibrant.getPalette.mockRejectedValue(new Error("boom"));
    steam.getPlayerSummary.mockResolvedValue(
      summary({ gameid: "1145360", gameextrainfo: "Hades" }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.state).toBe("playing");
    expect(body.palette ?? {}).toEqual({});
  });

  it("skips palette extraction for non-Steam shortcuts", async () => {
    steam.getPlayerSummary.mockResolvedValue(
      summary({ gameid: "13808553434592411648", gameextrainfo: "Minecraft" }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(vibrant.from).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "playing",
        game: expect.objectContaining({ appId: null, headerUrl: null }),
      }),
    );
  });

  it("only allows https Steam CDN hosts for palette fetches", () => {
    expect(isAllowedImageUrl(HADES_HEADER)).toBe(true);
    expect(
      isAllowedImageUrl("https://cdn.akamai.steamstatic.com/steam/apps/1/header.jpg"),
    ).toBe(true);
    expect(isAllowedImageUrl("http://shared.akamai.steamstatic.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evil.example.com/x.jpg")).toBe(false);
    expect(
      isAllowedImageUrl("https://shared.akamai.steamstatic.com.evil.com/x.jpg"),
    ).toBe(false);
    expect(isAllowedImageUrl("not a url")).toBe(false);
  });

  it("on 429 honors Retry-After and serves the last known presence", async () => {
    steam.getPlayerSummary.mockResolvedValueOnce(
      summary({ gameid: "1145360", gameextrainfo: "Hades" }),
    );
    await handler({ method: "GET" }, mockRes());

    steam.getPlayerSummary.mockResolvedValueOnce(
      new Response("", { status: 429, headers: { "retry-after": "20" } }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.headers["Cache-Control"]).toBe("public, s-maxage=20");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ state: "playing", game: expect.objectContaining({ name: "Hades" }) }),
    );
  });

  it("on 429 clamps Retry-After and serves unavailable with nothing cached", async () => {
    steam.getPlayerSummary
      .mockResolvedValueOnce(
        new Response("", { status: 429, headers: { "retry-after": "3600" } }),
      )
      .mockResolvedValueOnce(new Response("", { status: 429 }));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.headers["Cache-Control"]).toBe("public, s-maxage=60");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ state: "unavailable" });

    const noHeader = mockRes();
    await handler({ method: "GET" }, noHeader);
    expect(noHeader.headers["Cache-Control"]).toBe("public, s-maxage=5");
  });

  it("serves the last known presence when Steam errors", async () => {
    steam.getPlayerSummary.mockResolvedValueOnce(summary());
    await handler({ method: "GET" }, mockRes());

    steam.getPlayerSummary.mockResolvedValueOnce(jsonResponse({}, 500));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers["Cache-Control"]).toBe("public, s-maxage=10");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ state: "online" }));

    steam.getPlayerSummary.mockRejectedValueOnce(new Error("network"));
    const thrown = mockRes();
    await handler({ method: "GET" }, thrown);
    expect(thrown.status).toHaveBeenCalledWith(200);
    expect(thrown.json).toHaveBeenCalledWith(expect.objectContaining({ state: "online" }));
  });

  it("returns 502 unavailable when Steam errors and nothing is cached", async () => {
    steam.getPlayerSummary.mockResolvedValueOnce(jsonResponse({}, 500));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ state: "unavailable" });
  });

  it("treats an empty players list as an error", async () => {
    steam.getPlayerSummary.mockResolvedValueOnce(
      jsonResponse({ response: { players: [] } }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ state: "unavailable" });
  });
});

describe("GET /api/steam/library", () => {
  let handler: (req: any, res: any) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    steam.isSteamConfigured.mockReset().mockReturnValue(true);
    steam.getOwnedGames.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    handler = (await import("../pages/api/steam/library")).default;
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects non-GET with 405", async () => {
    const res = mockRes();
    await handler({ method: "DELETE" }, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.headers.Allow).toBe("GET");
    expect(steam.getOwnedGames).not.toHaveBeenCalled();
  });

  it("returns 404 when Steam is not configured", async () => {
    steam.isSteamConfigured.mockReturnValue(false);
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(steam.getOwnedGames).not.toHaveBeenCalled();
  });

  it("returns top and lately with a long CDN cache", async () => {
    steam.getOwnedGames.mockResolvedValue(
      jsonResponse({
        response: {
          game_count: 3,
          games: [
            { appid: 1, name: "A", playtime_forever: 100 },
            { appid: 2, name: "B", playtime_forever: 900, playtime_2weeks: 60 },
            { appid: 3, name: "C", playtime_forever: 0 },
          ],
        },
      }),
    );
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.headers["Cache-Control"]).toBe(
      "public, s-maxage=21600, stale-while-revalidate=86400",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.top.map((g: { appId: number }) => g.appId)).toEqual([2, 1]);
    expect(body.lately.map((g: { appId: number }) => g.appId)).toEqual([2]);
  });

  it("returns 502 when Steam fails", async () => {
    steam.getOwnedGames.mockResolvedValue(jsonResponse({}, 500));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ top: [], lately: [] }),
    );
  });

  it("returns 502 when the game list is missing (private game details)", async () => {
    steam.getOwnedGames.mockResolvedValue(jsonResponse({ response: {} }));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("returns 502 when the request throws", async () => {
    steam.getOwnedGames.mockRejectedValue(new Error("network"));
    const res = mockRes();
    await handler({ method: "GET" }, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });
});

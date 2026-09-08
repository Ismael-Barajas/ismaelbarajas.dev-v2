import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nowPlayingFetcher, {
  IDLE_POLL_MS,
  PAUSED_POLL_MS,
  PLAYING_POLL_MS,
  nowPlayingRefreshInterval,
  type NowPlayingSong,
} from "lib/nowPlayingFetcher";

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers });

describe("nowPlayingFetcher", () => {
  afterEach(() => vi.restoreAllMocks());

  it("adds the CDN Age header to progress while playing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        { isPlaying: true, progressMs: 10_000, durationMs: 200_000 },
        { age: "4" },
      ),
    );
    const song = await nowPlayingFetcher("/api/now-playing");
    expect(song.progressMs).toBe(14_000);
    expect(song.receivedAt).toBeGreaterThan(0);
  });

  it("clamps Age-adjusted progress to the track duration", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        { isPlaying: true, progressMs: 199_000, durationMs: 200_000 },
        { age: "9" },
      ),
    );
    const song = await nowPlayingFetcher("/api/now-playing");
    expect(song.progressMs).toBe(200_000);
  });

  it("leaves progress alone when paused or when Age is missing", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(
          { isPlaying: false, progressMs: 10_000, durationMs: 200_000 },
          { age: "4" },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ isPlaying: true, progressMs: 10_000, durationMs: 200_000 }),
      );
    expect((await nowPlayingFetcher("/x")).progressMs).toBe(10_000);
    expect((await nowPlayingFetcher("/x")).progressMs).toBe(10_000);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("nowPlayingRefreshInterval", () => {
  const base: NowPlayingSong = {
    album: "",
    albumImageUrl: "",
    artist: "",
    isPlaying: false,
    receivedAt: 1,
    songUrl: "https://open.spotify.com/track/x",
    title: "",
  };

  it("polls fastest while playing", () => {
    expect(nowPlayingRefreshInterval({ ...base, isPlaying: true, durationMs: 1 })).toBe(
      PLAYING_POLL_MS,
    );
  });

  it("polls at the paused rate when a track is loaded but not playing", () => {
    expect(nowPlayingRefreshInterval({ ...base, durationMs: 1000 })).toBe(PAUSED_POLL_MS);
  });

  it("backs off when idle or on the last-played fallback", () => {
    expect(nowPlayingRefreshInterval(undefined)).toBe(IDLE_POLL_MS);
    expect(nowPlayingRefreshInterval({ ...base, durationMs: 0 })).toBe(IDLE_POLL_MS);
    expect(nowPlayingRefreshInterval({ ...base, songUrl: "" })).toBe(IDLE_POLL_MS);
  });
});

// --- API route ---

vi.mock("node-vibrant/node", () => ({
  Vibrant: { from: () => ({ getPalette: () => Promise.reject(new Error("skip")) }) },
}));

const spotify = vi.hoisted(() => ({
  getNowPlaying: vi.fn(),
  getRecentlyPlayed: vi.fn(),
}));
vi.mock("lib/spotify", () => spotify);

const track = {
  name: "Song",
  duration_ms: 200_000,
  explicit: false,
  popularity: 50,
  artists: [{ name: "Artist" }],
  album: { name: "Album", images: [] },
  external_urls: { spotify: "https://open.spotify.com/track/x" },
};

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

describe("GET /api/now-playing", () => {
  let handler: (req: any, res: any) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    spotify.getNowPlaying.mockReset();
    spotify.getRecentlyPlayed.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    handler = (await import("../pages/api/now-playing")).default;
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses the short cache while a track is loaded", async () => {
    spotify.getNowPlaying.mockResolvedValue(
      jsonResponse({ item: track, is_playing: true, progress_ms: 5 }),
    );
    const res = mockRes();
    await handler({}, res);
    expect(res.headers["Cache-Control"]).toContain("s-maxage=5");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: true, progressMs: 5, title: "Song" }),
    );
    expect(spotify.getRecentlyPlayed).not.toHaveBeenCalled();
  });

  it("uses the long cache when idle", async () => {
    spotify.getNowPlaying.mockResolvedValue(new Response(null, { status: 204 }));
    spotify.getRecentlyPlayed.mockResolvedValue(jsonResponse({ items: [] }));
    const res = mockRes();
    await handler({}, res);
    expect(res.headers["Cache-Control"]).toContain("s-maxage=30");
    expect(res.json).toHaveBeenCalledWith({ isPlaying: false });
  });

  it("on 429 honors Retry-After, serves the last known state, and skips the fallback", async () => {
    spotify.getNowPlaying.mockResolvedValueOnce(
      jsonResponse({ item: track, is_playing: true, progress_ms: 5 }),
    );
    await handler({}, mockRes());

    spotify.getNowPlaying.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { status: 429, reason: "QUOTA_EXCEEDED" } }),
        { status: 429, headers: { "retry-after": "20" } },
      ),
    );
    const res = mockRes();
    await handler({}, res);

    expect(res.headers["Cache-Control"]).toBe(
      "public, s-maxage=20, stale-while-revalidate=20",
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Song", isPlaying: true }),
    );
    expect(spotify.getRecentlyPlayed).not.toHaveBeenCalled();
  });

  it("clamps an oversized Retry-After and falls back to idle with nothing cached", async () => {
    spotify.getNowPlaying.mockResolvedValueOnce(
      new Response("", { status: 429, headers: { "retry-after": "3600" } }),
    );
    const res = mockRes();
    await handler({}, res);
    expect(res.headers["Cache-Control"]).toContain("s-maxage=60");
    expect(res.json).toHaveBeenCalledWith({ isPlaying: false });
  });

  it("handles a 429 from the recently-played fallback without retrying", async () => {
    spotify.getNowPlaying.mockResolvedValue(new Response(null, { status: 204 }));
    spotify.getRecentlyPlayed.mockResolvedValue(
      new Response("", { status: 429, headers: { "retry-after": "1" } }),
    );
    const res = mockRes();
    await handler({}, res);
    expect(res.headers["Cache-Control"]).toContain("s-maxage=5");
    expect(res.json).toHaveBeenCalledWith({ isPlaying: false });
    expect(spotify.getRecentlyPlayed).toHaveBeenCalledTimes(1);
  });
});

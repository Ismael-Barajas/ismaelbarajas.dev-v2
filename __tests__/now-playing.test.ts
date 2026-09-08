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

// Palette extraction is skipped, but tests can make it "take" wall-clock time
// to simulate slow origin work between the Spotify sample and the response.
const clock = vi.hoisted(() => ({ paletteMs: 0 }));
vi.mock("node-vibrant/node", () => ({
  Vibrant: {
    from: () => ({
      getPalette: () => {
        if (clock.paletteMs) vi.setSystemTime(Date.now() + clock.paletteMs);
        return Promise.reject(new Error("skip"));
      },
    }),
  },
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

  afterEach(() => {
    clock.paletteMs = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("rolls origin processing time into progress so the cached sample is fresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    clock.paletteMs = 800;
    const withArt = { ...track, album: { ...track.album, images: [{ url: "https://i.scdn.co/x" }] } };
    spotify.getNowPlaying.mockResolvedValue(
      jsonResponse({ item: withArt, is_playing: true, progress_ms: 10_000 }),
    );
    const res = mockRes();
    await handler({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ progressMs: 10_800 }));
  });

  it("does not advance progress while paused", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    clock.paletteMs = 800;
    const withArt = { ...track, album: { ...track.album, images: [{ url: "https://i.scdn.co/x" }] } };
    spotify.getNowPlaying.mockResolvedValue(
      jsonResponse({ item: withArt, is_playing: false, progress_ms: 10_000 }),
    );
    const res = mockRes();
    await handler({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ progressMs: 10_000 }));
  });

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

// --- progress smoothing ---

import {
  RESYNC_THRESHOLD_MS,
  estimateProgress,
  shouldResync,
  type ProgressAnchor,
} from "lib/songProgress";

describe("songProgress", () => {
  const anchor: ProgressAnchor = {
    progressMs: 60_000,
    at: 1_000_000,
    songUrl: "https://open.spotify.com/track/a",
    isPlaying: true,
  };

  it("estimates by adding elapsed wall-clock time while playing", () => {
    expect(estimateProgress(anchor, 1_004_000)).toBe(64_000);
    expect(estimateProgress({ ...anchor, isPlaying: false }, 1_004_000)).toBe(60_000);
    // Never runs backwards if the clock is somehow behind the anchor.
    expect(estimateProgress(anchor, 999_000)).toBe(60_000);
  });

  it("always resyncs with no anchor", () => {
    expect(shouldResync(null, anchor, 1_000_000)).toBe(true);
  });

  it("ignores samples inside the noise threshold", () => {
    // Sample taken 5s later that says the song is 400ms "ahead" of our clock.
    const sample = { ...anchor, progressMs: 65_400, at: 1_005_000 };
    expect(shouldResync(anchor, sample, 1_005_000)).toBe(false);
    const behind = { ...anchor, progressMs: 64_600, at: 1_005_000 };
    expect(shouldResync(anchor, behind, 1_005_000)).toBe(false);
  });

  it("resyncs on a seek larger than the threshold", () => {
    const sample = { ...anchor, progressMs: 65_000 + RESYNC_THRESHOLD_MS + 1, at: 1_005_000 };
    expect(shouldResync(anchor, sample, 1_005_000)).toBe(true);
    const back = { ...anchor, progressMs: 20_000, at: 1_005_000 };
    expect(shouldResync(anchor, back, 1_005_000)).toBe(true);
  });

  it("resyncs on a track change or play/pause even when positions agree", () => {
    expect(
      shouldResync(anchor, { ...anchor, songUrl: "https://open.spotify.com/track/b" }, 1_000_000),
    ).toBe(true);
    expect(shouldResync(anchor, { ...anchor, isPlaying: false }, 1_000_000)).toBe(true);
  });
});

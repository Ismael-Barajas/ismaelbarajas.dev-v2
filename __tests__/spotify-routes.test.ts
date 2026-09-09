import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("lib/spotify", () => ({
  getSavedTracks: vi.fn(),
  getMe: vi.fn(),
  getPlaylists: vi.fn(),
  getTopTracks: vi.fn(),
}));

import * as spotify from "lib/spotify";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res;
}

const track = (name: string) => ({
  album: { images: [{ url: `https://i.scdn.co/${name}.jpg` }] },
  artists: [{ name: "Artist" }],
  duration_ms: 1000,
  explicit: false,
  external_urls: { spotify: `https://open.spotify.com/track/${name}` },
  name,
  popularity: 50,
});

describe("GET /api/liked-songs", () => {
  beforeEach(() => vi.mocked(spotify.getSavedTracks).mockReset());

  it("skips entries whose track is null instead of failing the whole list", async () => {
    vi.mocked(spotify.getSavedTracks).mockResolvedValue(
      json({
        total: 3,
        items: [
          { added_at: "2026-01-01T00:00:00Z", track: track("a") },
          { added_at: "2026-01-02T00:00:00Z", track: null },
          { added_at: "2026-01-03T00:00:00Z", track: track("c") },
        ],
      }),
    );
    const { default: handler } = await import("../pages/api/liked-songs");
    const res = mockRes();
    await handler({ method: "GET" } as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.total).toBe(3);
    expect(body.tracks.map((t: { title: string }) => t.title)).toEqual(["a", "c"]);
  });

  it("returns 502 when Spotify fails", async () => {
    vi.mocked(spotify.getSavedTracks).mockResolvedValue(json({}, 500));
    const { default: handler } = await import("../pages/api/liked-songs");
    const res = mockRes();
    await handler({ method: "GET" } as any, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("rejects non-GET", async () => {
    const { default: handler } = await import("../pages/api/liked-songs");
    const res = mockRes();
    await handler({ method: "POST" } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(spotify.getSavedTracks).not.toHaveBeenCalled();
  });
});

describe("GET /api/playlists", () => {
  it("returns 502 when Spotify fails", async () => {
    vi.mocked(spotify.getMe).mockResolvedValue(json({}, 401));
    vi.mocked(spotify.getPlaylists).mockResolvedValue(json({}, 401));
    const { default: handler } = await import("../pages/api/playlists");
    const res = mockRes();
    await handler({ method: "GET" } as any, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("rejects non-GET", async () => {
    const { default: handler } = await import("../pages/api/playlists");
    const res = mockRes();
    await handler({ method: "DELETE" } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("GET /api/top-tracks", () => {
  it("returns 502 when Spotify fails", async () => {
    vi.mocked(spotify.getTopTracks).mockResolvedValue(json({}, 500));
    const { default: handler } = await import("../pages/api/top-tracks");
    const res = mockRes();
    await handler({ method: "GET", query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("rejects non-GET", async () => {
    const { default: handler } = await import("../pages/api/top-tracks");
    const res = mockRes();
    await handler({ method: "PUT", query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

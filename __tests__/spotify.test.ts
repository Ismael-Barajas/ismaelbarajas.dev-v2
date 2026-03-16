import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getNowPlaying, getTopTracks } from "lib/spotify";

describe("spotify", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SPOTIFY_CLIENT_ID: "test-client-id",
      SPOTIFY_CLIENT_SECRET: "test-client-secret",
      SPOTIFY_REFRESH_TOKEN: "test-refresh-token",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws when env vars are missing", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    await expect(getNowPlaying()).rejects.toThrow(
      "Missing Spotify environment variables"
    );
  });

  it("getNowPlaying fetches the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "mock-token" }), {
        status: 200,
      })
    ).mockResolvedValueOnce(
      new Response(JSON.stringify({ is_playing: true }), { status: 200 })
    );

    await getNowPlaying();

    // First call: token endpoint
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://accounts.spotify.com/api/token",
      expect.objectContaining({ method: "POST" })
    );

    // Second call: now playing endpoint
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/me/player/currently-playing",
      expect.objectContaining({
        headers: { Authorization: "Bearer mock-token" },
      })
    );
  });

  it("getTopTracks fetches the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "mock-token" }), {
        status: 200,
      })
    ).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 })
    );

    await getTopTracks();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/me/top/tracks",
      expect.objectContaining({
        headers: { Authorization: "Bearer mock-token" },
      })
    );
  });

  it("throws when token request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(getNowPlaying()).rejects.toThrow(
      "Failed to get Spotify access token: 401"
    );
  });

  it("sends correct Basic auth header for token request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "t" }), { status: 200 })
    ).mockResolvedValueOnce(
      new Response("{}", { status: 200 })
    );

    await getNowPlaying();

    const tokenCall = fetchSpy.mock.calls[0];
    const headers = (tokenCall[1] as RequestInit).headers as Record<string, string>;
    const expected = Buffer.from("test-client-id:test-client-secret").toString("base64");
    expect(headers.Authorization).toBe(`Basic ${expected}`);
  });
});

// additional_types is required or Spotify returns a null item for podcast episodes.
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode`;
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;
const ME_ENDPOINT = `https://api.spotify.com/v1/me`;
const PLAYLISTS_ENDPOINT = `https://api.spotify.com/v1/me/playlists`;
const SAVED_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/tracks`;

export type TimeRange = "short_term" | "medium_term" | "long_term";
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
    process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error("Missing Spotify environment variables");
  }

  const basic = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify access token: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.accessToken;
};

export const getNowPlaying = async () => {
  const accessToken = await getAccessToken();

  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/** Requires the user-read-recently-played scope. */
export const getRecentlyPlayed = async (limit = 1) => {
  const accessToken = await getAccessToken();

  return fetch(`${RECENTLY_PLAYED_ENDPOINT}?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const authed = async (url: string) => {
  const accessToken = await getAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const getTopTracks = async (
  timeRange: TimeRange = "short_term",
  limit = 10,
) => authed(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=${limit}`);

export const getMe = async () => authed(ME_ENDPOINT);

/** Requires the playlist-read-private scope. */
export const getPlaylists = async (limit = 50) =>
  authed(`${PLAYLISTS_ENDPOINT}?limit=${limit}`);

/** Requires the user-library-read scope. */
export const getSavedTracks = async (limit = 10) =>
  authed(`${SAVED_TRACKS_ENDPOINT}?limit=${limit}`);

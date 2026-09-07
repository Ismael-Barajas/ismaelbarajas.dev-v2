// One-shot helper to mint a new SPOTIFY_REFRESH_TOKEN.
//
// Spotify refresh tokens expire six months after authorization, so this needs
// re-running periodically. Usage:
//
//   node scripts/spotify-refresh-token.mjs
//
// Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local, and the
// redirect URI below registered on the app at developer.spotify.com/dashboard.
// The new refresh token is printed to the terminal; paste it into .env.local
// and into the Vercel project's environment variables.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { exec } from "node:child_process";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ["user-read-currently-playing", "user-top-read"];

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key, rest.join("=").trim().replace(/^"|"$/g, "")];
    }),
);

const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");

const authorizeUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    state,
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const finish = (status, message) => {
    res.writeHead(status, { "Content-Type": "text/plain" }).end(message);
    server.close();
  };

  if (url.searchParams.get("state") !== state) {
    finish(400, "State mismatch. Re-run the script.");
    console.error("State mismatch; aborting.");
    return;
  }

  const authError = url.searchParams.get("error");
  if (authError) {
    finish(400, `Spotify returned an error: ${authError}`);
    console.error("Authorization failed:", authError);
    return;
  }

  const code = url.searchParams.get("code");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const body = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok || !body.refresh_token) {
    finish(500, "Token exchange failed. Check the terminal.");
    console.error("Token exchange failed:", tokenRes.status, JSON.stringify(body));
    return;
  }

  finish(200, "Done. You can close this tab and return to the terminal.");

  console.log("\nNew refresh token (scopes: " + body.scope + "):\n");
  console.log(`SPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n`);
  console.log("Update .env.local and the Vercel environment, then redeploy.");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log("Make sure that exact redirect URI is registered on your Spotify app.\n");
  console.log("Opening the Spotify authorize page. If it does not open, visit:\n");
  console.log(authorizeUrl + "\n");

  const opener =
    process.platform === "win32"
      ? `start "" "${authorizeUrl}"`
      : process.platform === "darwin"
        ? `open "${authorizeUrl}"`
        : `xdg-open "${authorizeUrl}"`;
  exec(opener);
});

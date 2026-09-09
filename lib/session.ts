import type { SessionOptions } from "iron-session";

export interface SessionData {
  isAdmin?: boolean;
}

/**
 * Seal lifetime in seconds. iron-session derives the cookie's Max-Age from
 * this (ttl minus a small skew), so setting `ttl` alone keeps the cookie and
 * the encrypted payload expiring together. Setting `cookieOptions.maxAge`
 * instead would leave the seal valid for iron-session's 14-day default.
 */
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 1 day

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_SECRET!,
  cookieName: "admin-session",
  ttl: SESSION_TTL_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

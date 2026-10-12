import type { IncomingMessage, ServerResponse } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession, type SessionOptions } from "iron-session";

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

/** Reads the admin session cookie (API routes and getServerSideProps alike). */
export function getSession(req: IncomingMessage, res: ServerResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

/**
 * Gate for admin API routes. Marks the response uncacheable, then answers
 * 401 and returns false for anyone who isn't signed in. Run it before the
 * CSRF check so an anonymous probe learns nothing about the route.
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  res.setHeader("Cache-Control", "private, no-store");
  const session = await getSession(req, res);
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

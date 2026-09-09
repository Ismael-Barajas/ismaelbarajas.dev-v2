import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { csrfCheck } from "lib/security";
import { rateLimit } from "lib/rateLimit";
import { verifyAdminPassword } from "lib/adminPassword";

export default async function login(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  if (csrfCheck(req, res)) return;

  const limited = await rateLimit(req, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    prefix: "login",
  });
  if (limited) {
    return res
      .status(429)
      .json({ error: "Too many login attempts. Try again later." });
  }

  const body: unknown = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { password } = body as { password?: unknown };
  if (typeof password !== "string" || !(await verifyAdminPassword(password))) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isAdmin = true;
  await session.save();

  return res.status(200).json({ ok: true });
}

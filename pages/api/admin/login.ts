import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { rateLimit, csrfCheck } from "lib/security";

export default async function login(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  if (csrfCheck(req, res)) return;

  if (rateLimit(req, { maxAttempts: 5, windowMs: 15 * 60 * 1000 })) {
    return res
      .status(429)
      .json({ error: "Too many login attempts. Try again later." });
  }

  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isAdmin = true;
  await session.save();

  return res.status(200).json({ ok: true });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "lib/session";

/**
 * Tells the client whether this browser holds an admin session. Always 200
 * (never 401) so the check is quiet for visitors; never cached.
 */
export default async function session(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store");
  const current = await getSession(req, res);
  return res.status(200).json({ isAdmin: Boolean(current.isAdmin) });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "lib/session";
import { csrfCheck } from "lib/security";

export default async function logout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  if (csrfCheck(req, res)) return;

  const session = await getSession(req, res);
  session.destroy();

  return res.status(200).json({ ok: true });
}

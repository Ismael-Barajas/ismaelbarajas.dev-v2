import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { prisma } from "lib/prisma";
import { csrfCheck, validateProjectInput } from "lib/security";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const items = await prisma.project.findMany({ orderBy: { order: "asc" } });
    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    if (csrfCheck(req, res)) return;

    const result = validateProjectInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const item = await prisma.project.create({ data: result.data });
    return res.status(201).json({ item });
  }

  return res.status(405).end();
}

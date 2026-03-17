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

  const id = parseInt(req.query.id as string, 10);
  if (isNaN(id) || id < 1) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const item = await prisma.project.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  }

  if (req.method === "PUT") {
    if (csrfCheck(req, res)) return;

    const result = validateProjectInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const item = await prisma.project.update({
      where: { id },
      data: result.data,
    });
    return res.status(200).json({ item });
  }

  if (req.method === "DELETE") {
    if (csrfCheck(req, res)) return;
    await prisma.project.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).end();
}

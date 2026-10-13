import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { createAtEnd } from "lib/orderedRows";
import { csrfCheck, validateProjectInput } from "lib/security";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) return;

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

    // New rows go to the end unless the caller placed them.
    const item = await createAtEnd("project", result.data.order, (tx, order) =>
      tx.project.create({ data: { ...result.data, order } }),
    );
    return res.status(201).json({ item });
  }

  return res.status(405).end();
}

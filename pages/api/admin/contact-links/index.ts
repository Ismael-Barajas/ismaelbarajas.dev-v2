import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, validateContactLinkInput } from "lib/security";
import { revalidatePaths } from "lib/revalidate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) return;

  if (req.method === "GET") {
    const items = await prisma.contactLink.findMany({
      orderBy: { order: "asc" },
    });
    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    if (csrfCheck(req, res)) return;

    const result = validateContactLinkInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    // New links go to the end unless the caller placed them.
    let { order } = result.data;
    if (order === undefined) {
      const { _max } = await prisma.contactLink.aggregate({
        _max: { order: true },
      });
      order = (_max.order ?? -1) + 1;
    }

    const item = await prisma.contactLink.create({
      data: { ...result.data, order },
    });
    await revalidatePaths(res, ["/"]);
    return res.status(201).json({ item });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

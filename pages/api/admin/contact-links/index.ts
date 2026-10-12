import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, validateContactLinkInput } from "lib/security";
import { revalidatePaths } from "lib/revalidate";
import { DEFAULT_CONTACT_LINKS } from "lib/content/defaults";

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

    const item = await prisma.$transaction(async (tx) => {
      const { _max } = await tx.contactLink.aggregate({
        _max: { order: true },
      });
      let next = (_max.order ?? -1) + 1;
      // An empty table means the site is showing the built-in links. Save
      // them first so the first Add extends that list instead of replacing it.
      if (_max.order === null) {
        await tx.contactLink.createMany({
          data: DEFAULT_CONTACT_LINKS.map(({ label, url, icon }, i) => ({
            label,
            url,
            icon,
            order: i,
          })),
        });
        next = DEFAULT_CONTACT_LINKS.length;
      }
      // New links go to the end unless the caller placed them.
      return tx.contactLink.create({
        data: { ...result.data, order: result.data.order ?? next },
      });
    });
    await revalidatePaths(res, ["/"]);
    return res.status(201).json({ item });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

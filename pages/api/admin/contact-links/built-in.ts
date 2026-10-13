import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck } from "lib/security";
import { lockOrder, saveBuiltInLinksIfEmpty } from "lib/orderedRows";

/**
 * POST /api/admin/contact-links/built-in: saves the built-in links as real
 * rows if no link is saved yet, then returns every saved link in order. The
 * admin view calls it before the first edit, delete or reorder of a built-in
 * link. The page already shows these links, so nothing is revalidated.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!(await requireAdmin(req, res))) return;
  if (csrfCheck(req, res)) return;

  const items = await prisma.$transaction(async (tx) => {
    await lockOrder(tx, "contactLink");
    await saveBuiltInLinksIfEmpty(tx);
    return tx.contactLink.findMany({ orderBy: { order: "asc" } });
  });
  return res.status(200).json({ items });
}

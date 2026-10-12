import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, validateContactLinkInput } from "lib/security";
import { parseId } from "lib/ids";
import { isRecordNotFound } from "lib/prismaErrors";
import { revalidatePaths } from "lib/revalidate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) return;

  const id = parseId(req.query.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const item = await prisma.contactLink.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  }

  if (req.method === "PUT") {
    if (csrfCheck(req, res)) return;

    const result = validateContactLinkInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const item = await prisma.contactLink.update({
        where: { id },
        data: result.data,
      });
      await revalidatePaths(res, ["/"]);
      return res.status(200).json({ item });
    } catch (error) {
      if (isRecordNotFound(error)) {
        return res.status(404).json({ error: "Not found" });
      }
      throw error;
    }
  }

  if (req.method === "DELETE") {
    if (csrfCheck(req, res)) return;
    try {
      await prisma.contactLink.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        return res.status(404).json({ error: "Not found" });
      }
      throw error;
    }
    await revalidatePaths(res, ["/"]);
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).end();
}

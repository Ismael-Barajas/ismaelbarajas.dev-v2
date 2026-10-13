import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, validateExperienceInput } from "lib/security";
import { parseId } from "lib/ids";
import { isRecordNotFound } from "lib/prismaErrors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) return;

  const id = parseId(req.query.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const item = await prisma.experience.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  }

  if (req.method === "PUT") {
    if (csrfCheck(req, res)) return;

    const result = validateExperienceInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const item = await prisma.experience.update({
        where: { id },
        data: result.data,
      });
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
      await prisma.experience.delete({ where: { id } });
      return res.status(204).end();
    } catch (error) {
      if (isRecordNotFound(error)) {
        return res.status(404).json({ error: "Not found" });
      }
      throw error;
    }
  }

  return res.status(405).end();
}

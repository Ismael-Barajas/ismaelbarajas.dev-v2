import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, sanitizeFacts, validateProfileInput } from "lib/security";
import { loadProfile } from "lib/content/load";
import { revalidatePaths } from "lib/revalidate";

/** The About section's singleton row (id 1). */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) return;

  if (req.method === "GET") {
    // `isDefault` is true until the first save creates the row.
    const { profile, isDefault } = await loadProfile();
    return res.status(200).json({ profile, isDefault });
  }

  if (req.method === "PUT") {
    if (csrfCheck(req, res)) return;

    const result = validateProfileInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const data = {
      ...result.data,
      // Plain objects so Prisma's JSON input type accepts them.
      facts: result.data.facts.map(({ label, icon }) => ({ label, icon })),
    };
    const row = await prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    await revalidatePaths(res, ["/"]);
    return res.status(200).json({
      profile: {
        bio: row.bio,
        photoUrl: row.photoUrl,
        facts: sanitizeFacts(row.facts),
      },
    });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).end();
}

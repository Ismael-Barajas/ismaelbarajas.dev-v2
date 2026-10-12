import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/session";
import { csrfCheck, validateReorderInput } from "lib/security";
import { revalidatePaths } from "lib/revalidate";

export type ReorderModel = "project" | "experience" | "contactLink";

/** The slice of a Prisma delegate the reorder needs; every model above has it. */
interface OrderedDelegate {
  findMany(args: { select: { id: true } }): Promise<{ id: number }[]>;
  update(args: {
    where: { id: number };
    data: { order: number };
  }): Promise<unknown>;
}

/**
 * Builds POST /api/admin/{kind}/reorder. The body lists every id in the new
 * display order; each row's `order` becomes its index. If the table no
 * longer holds exactly those ids (another tab added or deleted a row), the
 * whole reorder is refused with 409 so the client can reload.
 */
export function createReorderHandler(
  model: ReorderModel,
  opts: { revalidate?: string[] } = {},
) {
  return async function reorder(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await requireAdmin(req, res))) return;
    if (csrfCheck(req, res)) return;

    const result = validateReorderInput(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    const { ids } = result.data;

    const applied = await prisma.$transaction(
      async (tx) => {
        const table = tx[model] as unknown as OrderedDelegate;
        const rows = await table.findMany({ select: { id: true } });
        const wanted = new Set(ids);
        if (
          rows.length !== ids.length ||
          !rows.every((row) => wanted.has(row.id))
        ) {
          return false;
        }
        // Sequential: an interactive transaction runs on one connection.
        for (const [index, id] of ids.entries()) {
          await table.update({ where: { id }, data: { order: index } });
        }
        return true;
      },
      { timeout: 15_000 },
    );

    if (!applied) {
      return res
        .status(409)
        .json({ error: "Items changed; reload and try again" });
    }

    await revalidatePaths(res, opts.revalidate ?? []);
    return res.status(200).json({ ok: true });
  };
}

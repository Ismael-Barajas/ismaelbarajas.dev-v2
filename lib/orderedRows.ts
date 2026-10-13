import type { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { DEFAULT_CONTACT_LINKS } from "lib/content/defaults";

/** Tables whose rows carry a display `order`. */
export type OrderedModel = "project" | "experience" | "contactLink";

/** The slice of a Prisma delegate nextOrder needs; every model above has it. */
interface OrderAggregate {
  aggregate(args: {
    _max: { order: true };
  }): Promise<{ _max: { order: number | null } }>;
}

/**
 * Holds a per-table lock until the transaction ends, so writes that depend
 * on the current order (append, reorder, saving the built-in links) run one
 * at a time. Without it two adds at the same moment both read the same max
 * and share an order value.
 */
export async function lockOrder(
  tx: Prisma.TransactionClient,
  model: OrderedModel,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${model}`}))`;
}

/** The order value that puts a new row last. */
export async function nextOrder(
  tx: Prisma.TransactionClient,
  model: OrderedModel,
): Promise<number> {
  const table = tx[model] as unknown as OrderAggregate;
  const { _max } = await table.aggregate({ _max: { order: true } });
  return (_max.order ?? -1) + 1;
}

/**
 * Creates a row at the end of its list, or at `order` when the caller placed
 * it. `create` runs inside the locked transaction with the order to use.
 */
export function createAtEnd<T>(
  model: OrderedModel,
  order: number | undefined,
  create: (tx: Prisma.TransactionClient, order: number) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await lockOrder(tx, model);
    return create(tx, order ?? (await nextOrder(tx, model)));
  });
}

/**
 * While the ContactLink table is empty the site shows the built-in links.
 * Saves them as real rows so the owner's first change edits that list
 * instead of replacing it. Does nothing once any link is saved. Call with
 * the contactLink lock held.
 */
export async function saveBuiltInLinksIfEmpty(
  tx: Prisma.TransactionClient,
): Promise<void> {
  if ((await tx.contactLink.count()) > 0) return;
  await tx.contactLink.createMany({
    data: DEFAULT_CONTACT_LINKS.map(({ label, url, icon }, i) => ({
      label,
      url,
      icon,
      order: i,
    })),
  });
}

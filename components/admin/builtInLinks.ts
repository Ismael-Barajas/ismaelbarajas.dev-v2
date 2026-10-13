import { mutate } from "swr";
import { ADMIN_KEYS, adminFetch } from "lib/adminApi";
import { pushToast } from "lib/toastStore";
import type { ContactLinkItem, WithId } from "lib/types/content";

type Link = WithId<ContactLinkItem>;

/**
 * Stand-in ids for the built-in links while no link is saved, so the admin
 * view can list, edit, delete and drag them like saved rows. Negative, so
 * they never collide with a real row.
 */
export const withBuiltInIds = (links: ContactLinkItem[]): Link[] =>
  links.map((link, index) => ({ ...link, id: -(index + 1) }));

const isBuiltIn = (link: Link) => link.id < 0;

/**
 * Swaps built-in stand-ins for real rows, saving the built-in links first if
 * any are present, and returns `links` in the same order. Saved rows are
 * matched by URL. Null when that fails; the error is already toasted.
 */
export async function toSavedLinks(links: Link[]): Promise<Link[] | null> {
  if (!links.some(isBuiltIn)) return links;

  let saved: Link[];
  try {
    ({ items: saved } = await adminFetch<{ items: Link[] }>(
      `${ADMIN_KEYS.contactLinks}/built-in`,
      { method: "POST" },
    ));
  } catch (err) {
    pushToast(
      "error",
      err instanceof Error && err.message ? err.message : "Couldn't save the links",
    );
    return null;
  }
  await mutate(ADMIN_KEYS.contactLinks, { items: saved }, { revalidate: false });

  const rows = links.map((link) =>
    isBuiltIn(link) ? saved.find((row) => row.url === link.url) : link,
  );
  if (rows.some((row) => row === undefined)) {
    // Another tab saved different links first; show those instead.
    pushToast("error", "Links changed; try again");
    return null;
  }
  return rows as Link[];
}

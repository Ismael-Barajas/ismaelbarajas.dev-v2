/**
 * Server-only loader for the About and Contact content, used by
 * getStaticProps on the homepage. Falls back to the built-in defaults on any
 * failure (no row yet, tables not pushed, database unreachable at build
 * time), so the page always renders.
 */
import { prisma } from "lib/prisma";
import { isContactIcon } from "lib/content/icons";
import { DEFAULT_CONTACT_LINKS, DEFAULT_PROFILE } from "lib/content/defaults";
import { sanitizeFacts } from "lib/security";
import type { ContactLinkItem, Profile, SiteContent } from "lib/types/content";

export async function loadProfile(): Promise<{ profile: Profile; isDefault: boolean }> {
  try {
    const row = await prisma.profile.findUnique({ where: { id: 1 } });
    if (!row) return { profile: DEFAULT_PROFILE, isDefault: true };
    return {
      profile: {
        bio: row.bio,
        photoUrl: row.photoUrl,
        facts: sanitizeFacts(row.facts),
      },
      isDefault: false,
    };
  } catch (err) {
    console.error("loadProfile failed; using defaults", err);
    return { profile: DEFAULT_PROFILE, isDefault: true };
  }
}

/** Public shape (no id/order); empty table falls back to the defaults. */
export async function loadContactLinks(): Promise<ContactLinkItem[]> {
  try {
    const rows = await prisma.contactLink.findMany({
      orderBy: { order: "asc" },
      select: { label: true, url: true, icon: true },
    });
    const links = rows.flatMap((r) =>
      isContactIcon(r.icon) ? [{ label: r.label, url: r.url, icon: r.icon }] : [],
    );
    return links.length ? links : DEFAULT_CONTACT_LINKS;
  } catch (err) {
    console.error("loadContactLinks failed; using defaults", err);
    return DEFAULT_CONTACT_LINKS;
  }
}

export async function loadSiteContent(): Promise<SiteContent> {
  const [{ profile }, contactLinks] = await Promise.all([
    loadProfile(),
    loadContactLinks(),
  ]);
  return { profile, contactLinks };
}

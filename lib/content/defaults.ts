/**
 * The built-in About and Contact content. Used to seed the database and as
 * the fallback whenever the Profile row or ContactLink table is missing,
 * empty or unreachable, so the homepage never renders blank. Data only.
 */
import { CONTACT_LINKS } from "lib/site";
import type { ContactLinkItem, Profile } from "lib/types/content";

export const DEFAULT_PROFILE: Profile = {
  bio: [
    "Hi! My name is Ismael Barajas.",
    "I'm a {age} year old Software Engineer based in Austin, Texas with a B.S. in Computer Science from California State University, Fullerton.",
    "Full stack engineer. I build across the whole stack: UI, backend, and infrastructure. Some of my projects are linked below.",
  ],
  photoUrl:
    "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/ismaelbarajas.jpg",
  facts: [
    { label: "Austin, TX", icon: "pin" },
    { label: "CSU Fullerton", icon: "graduation" },
    { label: "Saronic Technologies", icon: "briefcase" },
    { label: "Full stack", icon: "layers" },
  ],
};

export const DEFAULT_CONTACT_LINKS: ContactLinkItem[] = CONTACT_LINKS.map(
  (link) => ({ label: link.name, url: link.url, icon: link.key }),
);

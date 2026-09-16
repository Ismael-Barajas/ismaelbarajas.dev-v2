/**
 * The site's map, shared by the NavBar, the /listen tabs, the Contact
 * section and the terminal's `cd`/`ls`/`open` commands (lib/commands.ts), so
 * adding a page or a section is one edit.
 */

export const SITE_ORIGIN = "https://ismaelbarajas.dev";

/** Home-page sections, in page order. */
export const SECTIONS = [
  { hash: "about", label: "About" },
  { hash: "experience", label: "Experience" },
  { hash: "projects", label: "Projects" },
  { hash: "contact", label: "Contact" },
] as const;

/** Pages the NavBar links to besides home. */
export const PAGES = [
  { pathname: "/listen", label: "Listen" },
  { pathname: "/compressions", label: "Compressions" },
] as const;

/** /listen tabs; "top" is the hashless default (components/library/ListenTabs.tsx). */
export const LISTEN_TABS = [
  { key: "top", label: "Top tracks" },
  { key: "playlists", label: "Playlists" },
  { key: "liked", label: "Liked songs" },
] as const;

/** /compressions section ids, in page order (components/compressions/sections). */
export const COMPRESSIONS_SECTIONS = [
  "why",
  "capabilities",
  "formats",
  "workflow",
  "whats-new",
  "download",
] as const;

export const CONTACT_LINKS = [
  { key: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/in/ismael-barajas/" },
  { key: "github", name: "GitHub", url: "https://github.com/Ismael-Barajas" },
  { key: "email", name: "Email", url: "mailto:ismaelbarajas.dev@gmail.com" },
  { key: "instagram", name: "Instagram", url: "https://instagram.com/lnxanee" },
] as const;

export type ContactKey = (typeof CONTACT_LINKS)[number]["key"];

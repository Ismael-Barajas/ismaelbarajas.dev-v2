/**
 * The contact links the terminal's `open` command can reach. Contact links
 * are editable in the database, so the homepage hands the live list to
 * `setContactLinks`; until then (and whenever the list is empty) the
 * built-in CONTACT_LINKS from lib/site.ts apply. Plain module state: the
 * terminal reads it at call time, nothing here is reactive.
 */
import { CONTACT_LINKS } from "./site";

export interface TerminalContact {
  /** What the visitor types: `open <key>`. */
  key: string;
  name: string;
  url: string;
}

const DEFAULTS: readonly TerminalContact[] = CONTACT_LINKS;

let links: readonly TerminalContact[] = DEFAULTS;

/** "My Blog!" becomes "my-blog"; a label with nothing typeable becomes "link". */
export function contactKey(label: string): string {
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || "link";
}

export const getContactLinks = (): readonly TerminalContact[] => links;

/** An empty list restores the defaults. Repeated labels get -2, -3 suffixes. */
export function setContactLinks(next: { label: string; url: string }[]): void {
  if (next.length === 0) {
    links = DEFAULTS;
    return;
  }
  const taken = new Set<string>();
  links = next.map(({ label, url }) => {
    const base = contactKey(label);
    let key = base;
    for (let n = 2; taken.has(key); n += 1) key = `${base}-${n}`;
    taken.add(key);
    return { key, name: label, url };
  });
}

/** For tests. */
export const resetContactLinks = (): void => {
  links = DEFAULTS;
};

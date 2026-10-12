/**
 * Icon keys the editable content may reference. Stored as plain strings in
 * the database and checked against these lists by the validators in
 * lib/security.ts; components/library/ContentIcon.tsx maps each key to a
 * react-icons component. Data only, so the seed and API routes can import it.
 */

export const FACT_ICONS = [
  "pin",
  "graduation",
  "briefcase",
  "layers",
  "code",
  "globe",
  "heart",
  "coffee",
  "music",
  "award",
  "book",
  "calendar",
] as const;

export const CONTACT_ICONS = [
  "linkedin",
  "github",
  "email",
  "instagram",
  "x",
  "website",
  "youtube",
  "resume",
] as const;

export type FactIcon = (typeof FACT_ICONS)[number];
export type ContactIcon = (typeof CONTACT_ICONS)[number];

export const isFactIcon = (value: unknown): value is FactIcon =>
  typeof value === "string" && (FACT_ICONS as readonly string[]).includes(value);

export const isContactIcon = (value: unknown): value is ContactIcon =>
  typeof value === "string" &&
  (CONTACT_ICONS as readonly string[]).includes(value);

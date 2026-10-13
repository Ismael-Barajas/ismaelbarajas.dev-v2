/**
 * Shapes of the editable homepage content, shared by the API routes, the
 * section components and the admin forms. `id` and `order` are present on
 * rows read through /api/admin/* and absent on the public endpoints.
 */
import type { ContactIcon, FactIcon } from "lib/content/icons";

export interface ProjectItem {
  id?: number;
  img: string;
  name: string;
  url: string;
  githubUrl: string;
  body: string[];
  tags: string[];
  order?: number;
}

export interface ExperienceItem {
  id?: number;
  img: string;
  url: string;
  position: string;
  timeCommitment: string;
  body: string[];
  tags: string[];
  order?: number;
}

export interface Fact {
  label: string;
  icon: FactIcon;
}

export interface Profile {
  /** Paragraphs; `{age}` renders the live age (lib/content/bio.ts). */
  bio: string[];
  photoUrl: string;
  facts: Fact[];
}

export interface ContactLinkItem {
  id?: number;
  label: string;
  url: string;
  icon: ContactIcon;
  order?: number;
}

/** What pages/index.tsx loads at build/revalidate time. */
export interface SiteContent {
  profile: Profile;
  contactLinks: ContactLinkItem[];
}

/** A row read through the admin API, where `id` is always present. */
export type WithId<T> = T & { id: number };

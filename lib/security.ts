import type { NextApiRequest, NextApiResponse } from "next";
import { isContactIcon, isFactIcon } from "./content/icons";
import type { ContactLinkItem, Fact, Profile } from "./types/content";

// Rate limiting lives in lib/rateLimit.ts; re-exported for convenience.
export { rateLimit, getClientIp } from "./rateLimit";

// --- CSRF Origin Check ---

/** Host portion of NEXT_PUBLIC_SITE_URL, whether it is set as a URL or a bare host. */
const siteHost = (): string | undefined => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
};

/**
 * Hosts a mutation request may originate from: the request's own Host, the
 * configured site host, and (outside production only) localhost.
 */
export function getAllowedHosts(requestHost?: string): string[] {
  const hosts = [requestHost, siteHost()];
  if (process.env.NODE_ENV !== "production") {
    hosts.push("localhost:3000", "localhost");
  }
  return hosts.filter((h): h is string => Boolean(h));
}

/**
 * Validates the request origin/referer against allowed origins.
 * Returns true if the origin is valid, false otherwise.
 */
export function validateOrigin(req: NextApiRequest): boolean {
  // Only check mutation methods
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }

  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  const host = req.headers["host"];

  // At least one of origin or referer must be present
  if (!origin && !referer) {
    return false;
  }

  const allowedHosts = getAllowedHosts(host);

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return allowedHosts.includes(originHost);
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return allowedHosts.includes(refererHost);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Middleware-style CSRF check. Returns 403 if origin is invalid.
 * Returns true if blocked, false if allowed.
 */
export function csrfCheck(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  if (!validateOrigin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return true;
  }
  return false;
}

// --- Input Validation ---

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isBoundedStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (item) => typeof item === "string" && item.length <= maxItemLength
    )
  );
}

/**
 * `order` is optional: absent means "leave it alone" on update (the API
 * routes append new rows at the end). Returns false when present but invalid.
 */
function parseOrder(value: unknown): number | undefined | false {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : false;
}

export interface ProjectInput {
  img: string;
  name: string;
  url: string;
  githubUrl: string;
  body: string[];
  tags: string[];
  order?: number;
}

export function validateProjectInput(
  data: unknown
): ValidationResult<ProjectInput> {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required" };
  }

  const { img, name, url, githubUrl, body, tags, order } = data as Record<
    string,
    unknown
  >;

  if (!isNonEmptyString(img) || !isValidUrl(img)) {
    return { valid: false, error: "Invalid or missing 'img' (must be a valid URL)" };
  }
  if (!isNonEmptyString(name) || name.length > 200) {
    return { valid: false, error: "Invalid or missing 'name' (max 200 chars)" };
  }
  if (!isNonEmptyString(url) || !isValidUrl(url)) {
    return { valid: false, error: "Invalid or missing 'url' (must be a valid URL)" };
  }
  if (!isNonEmptyString(githubUrl) || !isValidUrl(githubUrl)) {
    return { valid: false, error: "Invalid or missing 'githubUrl' (must be a valid URL)" };
  }

  const validBody = body === undefined || body === null ? [] : body;
  if (!isBoundedStringArray(validBody, 50, 5000)) {
    return { valid: false, error: "'body' must be an array of strings (max 50 items, 5000 chars each)" };
  }

  const validTags = tags === undefined || tags === null ? [] : tags;
  if (!isBoundedStringArray(validTags, 30, 100)) {
    return { valid: false, error: "'tags' must be an array of strings (max 30 items, 100 chars each)" };
  }

  const validOrder = parseOrder(order);
  if (validOrder === false) {
    return { valid: false, error: "'order' must be a non-negative integer" };
  }

  return {
    valid: true,
    data: {
      img: img.trim(),
      name: name.trim(),
      url: url.trim(),
      githubUrl: githubUrl.trim(),
      body: validBody.map((s) => s.trim()),
      tags: validTags.map((s) => s.trim()),
      ...(validOrder === undefined ? {} : { order: validOrder }),
    },
  };
}

export interface ExperienceInput {
  img: string;
  url: string;
  position: string;
  timeCommitment: string;
  body: string[];
  tags: string[];
  order?: number;
}

export function validateExperienceInput(
  data: unknown
): ValidationResult<ExperienceInput> {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required" };
  }

  const { img, url, position, timeCommitment, body, tags, order } =
    data as Record<string, unknown>;

  if (!isNonEmptyString(img) || !isValidUrl(img)) {
    return { valid: false, error: "Invalid or missing 'img' (must be a valid URL)" };
  }
  if (!isNonEmptyString(url) || !isValidUrl(url)) {
    return { valid: false, error: "Invalid or missing 'url' (must be a valid URL)" };
  }
  if (!isNonEmptyString(position) || position.length > 200) {
    return { valid: false, error: "Invalid or missing 'position' (max 200 chars)" };
  }
  if (!isNonEmptyString(timeCommitment) || timeCommitment.length > 100) {
    return {
      valid: false,
      error: "Invalid or missing 'timeCommitment' (max 100 chars)",
    };
  }

  const validBody = body === undefined || body === null ? [] : body;
  if (!isBoundedStringArray(validBody, 50, 5000)) {
    return { valid: false, error: "'body' must be an array of strings (max 50 items, 5000 chars each)" };
  }

  const validTags = tags === undefined || tags === null ? [] : tags;
  if (!isBoundedStringArray(validTags, 30, 100)) {
    return { valid: false, error: "'tags' must be an array of strings (max 30 items, 100 chars each)" };
  }

  const validOrder = parseOrder(order);
  if (validOrder === false) {
    return { valid: false, error: "'order' must be a non-negative integer" };
  }

  return {
    valid: true,
    data: {
      img: img.trim(),
      url: url.trim(),
      position: (position as string).trim(),
      timeCommitment: (timeCommitment as string).trim(),
      body: validBody.map((s) => s.trim()),
      tags: validTags.map((s) => s.trim()),
      ...(validOrder === undefined ? {} : { order: validOrder }),
    },
  };
}

// --- Editable homepage content ---

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * https URL on the Vercel Blob public host. The portrait renders through
 * next/image, which throws for hosts outside `images.remotePatterns`, so a
 * looser check here could take the homepage down.
 */
export function isBlobImageUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** `https:` URL, or a `mailto:` with an address. Rejects http, javascript:, data: etc. */
export function isHttpsOrMailto(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return Boolean(url.hostname);
    if (url.protocol === "mailto:") return /^[^\s@]+@[^\s@]+$/.test(url.pathname);
    return false;
  } catch {
    return false;
  }
}

export const MAX_FACTS = 12;
const MAX_BIO_PARAGRAPHS = 10;

function parseFact(value: unknown): Fact | null {
  if (!value || typeof value !== "object") return null;
  const { label, icon } = value as Record<string, unknown>;
  if (!isNonEmptyString(label) || label.trim().length > 60) return null;
  if (!isFactIcon(icon)) return null;
  return { label: label.trim(), icon };
}

/**
 * Keeps only well-formed fact chips from the Profile.facts JSON column, so a
 * hand-edited or stale row can't break the About section.
 */
export function sanitizeFacts(value: unknown): Fact[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseFact)
    .filter((f): f is Fact => f !== null)
    .slice(0, MAX_FACTS);
}

export function validateProfileInput(data: unknown): ValidationResult<Profile> {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required" };
  }
  const { bio, photoUrl, facts } = data as Record<string, unknown>;

  if (
    !Array.isArray(bio) ||
    bio.length < 1 ||
    bio.length > MAX_BIO_PARAGRAPHS ||
    !bio.every((p) => isNonEmptyString(p) && p.length <= 1000)
  ) {
    return {
      valid: false,
      error: "'bio' must be 1-10 non-empty paragraphs (max 1000 chars each)",
    };
  }
  if (!isBlobImageUrl(photoUrl)) {
    return {
      valid: false,
      error: "Invalid 'photoUrl' (must be an uploaded image URL)",
    };
  }
  const rawFacts = facts === undefined || facts === null ? [] : facts;
  if (!Array.isArray(rawFacts) || rawFacts.length > MAX_FACTS) {
    return { valid: false, error: `'facts' must be an array (max ${MAX_FACTS})` };
  }
  const parsedFacts = rawFacts.map(parseFact);
  if (parsedFacts.some((f) => f === null)) {
    return {
      valid: false,
      error: "Each fact needs a label (max 60 chars) and a known icon",
    };
  }

  return {
    valid: true,
    data: {
      bio: (bio as string[]).map((p) => p.trim()),
      photoUrl: (photoUrl as string).trim(),
      facts: parsedFacts as Fact[],
    },
  };
}

export type ContactLinkInput = Omit<ContactLinkItem, "id" | "order"> & {
  order?: number;
};

export function validateContactLinkInput(
  data: unknown
): ValidationResult<ContactLinkInput> {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required" };
  }
  const { label, url, icon, order } = data as Record<string, unknown>;

  if (!isNonEmptyString(label) || label.trim().length > 40) {
    return { valid: false, error: "Invalid or missing 'label' (max 40 chars)" };
  }
  if (!isNonEmptyString(url) || url.length > 500 || !isHttpsOrMailto(url.trim())) {
    return {
      valid: false,
      error: "Invalid 'url' (must be an https:// or mailto: link)",
    };
  }
  if (!isContactIcon(icon)) {
    return { valid: false, error: "Invalid 'icon'" };
  }
  const validOrder = parseOrder(order);
  if (validOrder === false) {
    return { valid: false, error: "'order' must be a non-negative integer" };
  }

  return {
    valid: true,
    data: {
      label: label.trim(),
      url: url.trim(),
      icon,
      ...(validOrder === undefined ? {} : { order: validOrder }),
    },
  };
}

const MAX_REORDER_IDS = 200;

/** Body of POST /api/admin/{kind}/reorder: `{ ids }` in the new display order. */
export function validateReorderInput(
  data: unknown
): ValidationResult<{ ids: number[] }> {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required" };
  }
  const { ids } = data as Record<string, unknown>;
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > MAX_REORDER_IDS ||
    !ids.every((id) => Number.isInteger(id) && (id as number) >= 1) ||
    new Set(ids).size !== ids.length
  ) {
    return {
      valid: false,
      error: `'ids' must be 1-${MAX_REORDER_IDS} unique positive integers`,
    };
  }
  return { valid: true, data: { ids: ids as number[] } };
}

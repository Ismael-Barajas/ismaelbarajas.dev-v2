import type { NextApiRequest, NextApiResponse } from "next";

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

interface ProjectInput {
  img: string;
  name: string;
  url: string;
  githubUrl: string;
  body: string[];
  tags: string[];
  order: number;
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

  const validOrder =
    order === undefined || order === null ? 0 : Number(order);
  if (!Number.isInteger(validOrder) || validOrder < 0) {
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
      order: validOrder,
    },
  };
}

interface ExperienceInput {
  img: string;
  url: string;
  position: string;
  timeCommitment: string;
  body: string[];
  tags: string[];
  order: number;
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

  const validOrder =
    order === undefined || order === null ? 0 : Number(order);
  if (!Number.isInteger(validOrder) || validOrder < 0) {
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
      order: validOrder,
    },
  };
}

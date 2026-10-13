/**
 * Client helpers for the admin API. SWR keys live here so the sections, the
 * drawer and the reorder hook all mutate the same cache entries.
 */
import { readApiError } from "./apiError";

/** SWR keys / endpoints for admin reads (uncached, rows include `id`). */
export const ADMIN_KEYS = {
  session: "/api/admin/session",
  projects: "/api/admin/projects",
  experiences: "/api/admin/experiences",
  profile: "/api/admin/profile",
  contactLinks: "/api/admin/contact-links",
} as const;

/** Public, CDN-cached endpoints the sections read when not signed in. */
export const PUBLIC_KEYS = {
  projects: "/api/projects",
  experiences: "/api/experience",
} as const;

/** Collections that support POST /api/admin/{kind}/reorder. */
export type ReorderKind = "projects" | "experiences" | "contact-links";

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

/**
 * JSON fetch against /api/admin/*. Same-origin, so the browser sends the
 * session cookie and the Origin header csrfCheck wants. Resolves undefined
 * for 204; throws AdminApiError with the server's message otherwise.
 */
export async function adminFetch<T = unknown>(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new AdminApiError(
      res.status,
      await readApiError(res, `Request failed (${res.status})`),
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

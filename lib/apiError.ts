/**
 * Pulls the `error` string out of a failed API response, falling back to a
 * caller-supplied message when the body is missing or not JSON.
 */
export async function readApiError(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    // Non-JSON body (e.g. a platform 5xx page).
  }
  return fallback;
}

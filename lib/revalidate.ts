import type { NextApiResponse } from "next";

/**
 * On-demand ISR for pages built from admin-edited content. Revalidation can
 * fail in dev or when the build-time database is missing; the edit itself
 * has already been saved, so a failure is logged and never fails the request.
 */
export async function revalidatePaths(
  res: NextApiResponse,
  paths: readonly string[],
): Promise<void> {
  for (const path of paths) {
    try {
      await res.revalidate(path);
    } catch (err) {
      console.error(`revalidate ${path} failed`, err);
    }
  }
}

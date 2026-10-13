import { mutate } from "swr";
import { AdminApiError, adminFetch } from "lib/adminApi";
import { pushToast } from "lib/toastStore";

/**
 * Shared delete flow for the admin lists: DELETE the row, refetch the list
 * behind `key`, toast. A 404 counts as success (someone already removed it);
 * any other failure toasts the error and leaves the list alone. Never rejects.
 */
export default async function deleteItem(
  path: string,
  id: number,
  key: string,
): Promise<void> {
  try {
    await adminFetch(`${path}/${id}`, { method: "DELETE" });
  } catch (err) {
    if (!(err instanceof AdminApiError && err.status === 404)) {
      pushToast(
        "error",
        err instanceof Error && err.message ? err.message : "Couldn't delete",
      );
      return;
    }
  }
  await mutate(key);
  pushToast("success", "Deleted");
}

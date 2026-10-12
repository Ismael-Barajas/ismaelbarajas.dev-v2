import { useCallback } from "react";
import { useSWRConfig } from "swr";
import {
  ADMIN_KEYS,
  AdminApiError,
  adminFetch,
  type ReorderKind,
} from "lib/adminApi";
import { pushToast } from "lib/toastStore";
import type { Fact, Profile } from "lib/types/content";

interface ProfileResponse {
  profile: Profile;
  isDefault: boolean;
}

/**
 * The `{items}` cache entry after a reorder: the new order, with each row's
 * `order` set to its index the way the reorder route writes it.
 */
export function reorderedList<T extends { id: number }>(
  next: T[],
): { items: T[] } {
  return { items: next.map((item, index) => ({ ...item, order: index })) };
}

/** The `{profile, isDefault}` cache entry with the facts in a new order. */
export function withFacts(
  current: ProfileResponse | undefined,
  facts: Fact[],
): ProfileResponse | undefined {
  return current && { ...current, profile: { ...current.profile, facts } };
}

const failed = (err: unknown, fallback: string) =>
  pushToast("error", err instanceof Error && err.message ? err.message : fallback);

/**
 * Saves a drag-and-drop reorder of projects, experiences or contact links.
 * The list moves at once (optimistic) and rolls back if the POST fails; a
 * 409 means the table changed underneath us (another tab added or deleted
 * a row), so the list is refetched too. Never rejects; failures toast.
 */
export default function useReorder<T extends { id: number }>(
  kind: ReorderKind,
  key: string,
): (next: T[]) => Promise<void> {
  const { mutate } = useSWRConfig();
  return useCallback(
    async (next: T[]) => {
      const payload = reorderedList(next);
      try {
        await mutate(
          key,
          async () => {
            await adminFetch(`/api/admin/${kind}/reorder`, {
              method: "POST",
              body: { ids: next.map((item) => item.id) },
            });
            return payload;
          },
          {
            optimisticData: payload,
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          },
        );
      } catch (err) {
        failed(err, "Couldn't save the new order");
        if (err instanceof AdminApiError && err.status === 409) {
          void mutate(key);
        }
      }
    },
    [kind, key, mutate],
  );
}

/**
 * Saves a new order for the About section's fact chips: updates the cached
 * profile at once, then PUTs the whole profile with the facts reordered.
 * Rolls back and toasts on failure. Needs the admin profile to be loaded
 * (useProfile does that for an admin).
 */
export function useReorderFacts(): (facts: Fact[]) => Promise<void> {
  const { mutate } = useSWRConfig();
  return useCallback(
    async (facts: Fact[]) => {
      try {
        await mutate<ProfileResponse>(
          ADMIN_KEYS.profile,
          async (current) => {
            if (!current) throw new Error("Profile hasn't loaded yet");
            const { profile } = await adminFetch<{ profile: Profile }>(
              ADMIN_KEYS.profile,
              { method: "PUT", body: { ...current.profile, facts } },
            );
            // The PUT upserts the row, so it is no longer the defaults.
            return { profile, isDefault: false };
          },
          {
            optimisticData: (current) => withFacts(current, facts)!,
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          },
        );
      } catch (err) {
        failed(err, "Couldn't save the new order");
        if (err instanceof AdminApiError && err.status === 409) {
          void mutate(ADMIN_KEYS.profile);
        }
      }
    },
    [mutate],
  );
}

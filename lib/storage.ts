/**
 * Storage helpers that never throw. Safari private mode, embedded webviews
 * and "block all cookies" settings all make `localStorage` access throw
 * rather than return null, so every read and write goes through here.
 */

export const safeGet = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeSet = (
  storage: Storage | undefined,
  key: string,
  value: string | null,
) => {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Private mode or storage disabled; callers keep working for this page.
  }
};

export const localStore = () =>
  typeof window === "undefined" ? undefined : window.localStorage;

export const sessionStore = () =>
  typeof window === "undefined" ? undefined : window.sessionStorage;

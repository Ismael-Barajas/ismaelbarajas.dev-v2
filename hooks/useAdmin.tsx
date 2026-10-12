import { useEffect, useSyncExternalStore } from "react";
import useSWR from "swr";
import { ADMIN_KEYS } from "lib/adminApi";
import { hasAdminHint, setAdminHint, setView, subscribe } from "lib/adminStore";
import fetcher from "lib/fetcher";

interface SessionResponse {
  isAdmin: boolean;
}

/** The hint lives in localStorage, so another tab logging in/out changes it. */
const subscribeHint = (cb: () => void) => {
  const unsubscribe = subscribe(cb);
  window.addEventListener("storage", cb);
  return () => {
    unsubscribe();
    window.removeEventListener("storage", cb);
  };
};

const getServerHint = () => false;

/**
 * Whether this browser holds an admin session. Only asks /api/admin/session
 * when the localStorage hint (set at login) is present, so visitors never
 * make the request. The hint is read through useSyncExternalStore with a
 * `false` server snapshot, so SSR and hydration agree. A response saying
 * `isAdmin: false` (expired or logged-out session) clears the hint and
 * switches the admin view off.
 */
export default function useAdmin(): {
  isAdmin: boolean;
  isLoading: boolean;
  mutate: () => Promise<unknown>;
} {
  const hint = useSyncExternalStore(subscribeHint, hasAdminHint, getServerHint);
  const { data, isLoading, mutate } = useSWR<SessionResponse>(
    hint ? ADMIN_KEYS.session : null,
    fetcher,
    { shouldRetryOnError: false, revalidateOnFocus: true },
  );

  const denied = data?.isAdmin === false;
  useEffect(() => {
    if (!denied) return;
    setAdminHint(false);
    setView(false);
  }, [denied]);

  return {
    isAdmin: hint && data?.isAdmin === true,
    isLoading: hint && isLoading,
    mutate: () => mutate(),
  };
}

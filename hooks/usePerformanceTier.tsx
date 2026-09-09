import { useEffect, useSyncExternalStore } from "react";
import {
  getAutoReason,
  getPreference,
  getServerTier,
  getTier,
  initPerf,
  setPreference,
  subscribe,
} from "lib/perfStore";
import type { AutoReason, PerfPreference, PerfTier } from "lib/perf";

const getServerPreference = (): PerfPreference => "auto";
const getServerReason = (): AutoReason => "capable";

/**
 * Effective performance tier plus the visitor's preference and, for Auto,
 * why it landed where it did. Server renders and the first client render
 * always report "full" so hydration matches; the real values arrive right
 * after via the external-store subscription.
 */
export default function usePerformanceTier(): {
  tier: PerfTier;
  preference: PerfPreference;
  autoReason: AutoReason;
  setPreference: (p: PerfPreference) => void;
} {
  useEffect(initPerf, []);
  const tier = useSyncExternalStore(subscribe, getTier, getServerTier);
  const preference = useSyncExternalStore(subscribe, getPreference, getServerPreference);
  const autoReason = useSyncExternalStore(subscribe, getAutoReason, getServerReason);
  return { tier, preference, autoReason, setPreference };
}

/**
 * Lets UI that needs the native cursor (the admin drawer's form fields sit
 * in the top layer, above TargetCursor) switch the custom cursor off.
 * Ref-counted so overlapping callers don't re-enable it early.
 */
import { useSyncExternalStore } from "react";

let count = 0;
let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export const isCursorSuspended = (): boolean => count > 0;

/** Suspends the custom cursor; call the returned function to release. */
export function suspendCursor(): () => void {
  count += 1;
  if (count === 1) emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count -= 1;
    if (count === 0) emit();
  };
}

export const useCursorSuspended = (): boolean =>
  useSyncExternalStore(subscribe, isCursorSuspended, () => false);

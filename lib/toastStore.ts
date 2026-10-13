/** Small queue of success/error messages for admin actions. */
import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  kind: "success" | "error";
  message: string;
}

const TOAST_MS = 4000;

let toasts: Toast[] = [];
let nextId = 1;
let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function dismissToast(id: number) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function pushToast(kind: Toast["kind"], message: string): number {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), TOAST_MS);
  }
  return id;
}

const EMPTY: Toast[] = [];
export const getToasts = (): Toast[] => toasts;

export const useToasts = (): Toast[] =>
  useSyncExternalStore(subscribe, getToasts, () => EMPTY);

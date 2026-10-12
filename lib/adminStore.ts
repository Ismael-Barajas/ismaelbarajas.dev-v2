/**
 * Browser-side admin UI state, in the same useSyncExternalStore shape as
 * lib/perfStore.ts: whether the homepage is in admin view, and which editor
 * drawer (if any) is open. Nothing here grants access; every write is
 * checked server-side by requireAdmin (lib/session.ts).
 */
import { useSyncExternalStore } from "react";
import { localStore, safeGet, safeSet, sessionStore } from "./storage";

export type DrawerKind = "project" | "experience" | "profile" | "contact";

export type DrawerState = {
  kind: DrawerKind;
  mode: "create" | "edit";
  /** Row id when editing a project, experience or contact link. */
  id?: number;
} | null;

/** sessionStorage: admin view stays on for this tab only. */
const VIEW_KEY = "admin-view";
/**
 * localStorage: set at login, cleared at logout. Only decides whether the
 * homepage bothers asking /api/admin/session, so visitors never make that
 * request. Not a credential.
 */
const HINT_KEY = "admin-hint";

let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

let view: boolean | null = null;
let drawer: DrawerState = null;

export function getView(): boolean {
  if (view === null) view = safeGet(sessionStore(), VIEW_KEY) === "1";
  return view;
}

const getServerView = () => false;

export function setView(on: boolean) {
  view = on;
  safeSet(sessionStore(), VIEW_KEY, on ? "1" : null);
  if (!on) drawer = null;
  emit();
}

export const toggleView = () => setView(!getView());

export const getDrawer = (): DrawerState => drawer;

export function openDrawer(next: NonNullable<DrawerState>) {
  drawer = next;
  emit();
}

export function closeDrawer() {
  if (drawer === null) return;
  drawer = null;
  emit();
}

export const hasAdminHint = (): boolean =>
  safeGet(localStore(), HINT_KEY) === "1";

export function setAdminHint(on: boolean) {
  safeSet(localStore(), HINT_KEY, on ? "1" : null);
}

export const useAdminView = (): boolean =>
  useSyncExternalStore(subscribe, getView, getServerView);

export const useAdminDrawer = (): DrawerState =>
  useSyncExternalStore(subscribe, getDrawer, () => null);

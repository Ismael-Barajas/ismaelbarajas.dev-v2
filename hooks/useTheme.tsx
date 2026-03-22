import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "theme";

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
    applyTheme(e.newValue);
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  if (listeners.length === 1) {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (listeners.length === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  emitChange();
}

function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export default function useTheme() {
  const resolvedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { resolvedTheme, setTheme };
}

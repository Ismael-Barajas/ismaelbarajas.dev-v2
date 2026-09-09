import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";

export const LISTEN_TABS = [
  { key: "top", label: "Top tracks" },
  { key: "playlists", label: "Playlists" },
  { key: "liked", label: "Liked songs" },
] as const;

export type ListenTab = (typeof LISTEN_TABS)[number]["key"];

export const tabId = (key: ListenTab) => `listen-tab-${key}`;
export const panelId = (key: ListenTab) => `listen-panel-${key}`;

const isTab = (v: string): v is ListenTab =>
  LISTEN_TABS.some((t) => t.key === v);

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getSnapshot = () => window.location.hash.replace(/^#/, "");
const getServerSnapshot = () => "";

/**
 * Reads the active tab from the URL hash so links like /listen#playlists
 * land on the right panel, and so the choice survives a refresh.
 */
export const useListenTab = (): [ListenTab, (t: ListenTab) => void] => {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const tab: ListenTab = isTab(hash) ? hash : "top";

  const setTab = (next: ListenTab) => {
    const url = next === "top" ? window.location.pathname : `#${next}`;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return [tab, setTab];
};

const ListenTabs = ({
  active,
  onChange,
}: {
  active: ListenTab;
  onChange: (t: ListenTab) => void;
}) => {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  // WAI-ARIA tabs pattern: one tab stop, arrows move and activate.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys = LISTEN_TABS.map((t) => t.key);
    const i = keys.indexOf(active);
    let next: ListenTab | null = null;
    if (e.key === "ArrowRight") next = keys[(i + 1) % keys.length];
    else if (e.key === "ArrowLeft") next = keys[(i - 1 + keys.length) % keys.length];
    else if (e.key === "Home") next = keys[0];
    else if (e.key === "End") next = keys[keys.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next);
    buttons.current[next]?.focus();
  };

  return (
    <div
      className="mx-auto mb-6 flex w-full max-w-2xl justify-center border-b border-gray-800 px-4 dark:border-gray-200"
      role="tablist"
      aria-label="Listening sections"
    >
      {LISTEN_TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            ref={(el) => {
              buttons.current[t.key] = el;
            }}
            id={tabId(t.key)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId(t.key)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={onKeyDown}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors duration-300 sm:px-4 ${
              isActive
                ? "border-text font-medium text-text"
                : "border-transparent text-gray-500 hover:text-text dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

export default ListenTabs;

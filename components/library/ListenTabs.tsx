import { useSyncExternalStore } from "react";

export const LISTEN_TABS = [
  { key: "top", label: "Top tracks" },
  { key: "playlists", label: "Playlists" },
  { key: "liked", label: "Liked songs" },
] as const;

export type ListenTab = (typeof LISTEN_TABS)[number]["key"];

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
}) => (
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
          type="button"
          role="tab"
          aria-selected={isActive}
          aria-controls={`listen-panel-${t.key}`}
          onClick={() => onChange(t.key)}
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

export default ListenTabs;

import { useState } from "react";
import useAdmin from "hooks/useAdmin";
import { adminFetch } from "lib/adminApi";
import { setAdminHint, setView } from "lib/adminStore";
import { pushToast } from "lib/toastStore";

const ACTION =
  "cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium text-text transition-colors duration-300 hover:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text disabled:cursor-default disabled:opacity-50 dark:hover:bg-white/10";

/**
 * Status pill shown while the admin view is on: a reminder that edits are
 * live, plus Exit (back to the normal view) and Log out.
 */
const AdminBar = () => {
  const { mutate } = useAdmin();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
      setAdminHint(false);
      setView(false);
      await mutate();
      pushToast("success", "Signed out");
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error && err.message ? err.message : "Couldn't sign out",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Admin view"
      className="fixed left-1/2 top-[4.5rem] z-[60] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-full bg-[#E0E0E0]/85 py-1 pl-3.5 pr-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl dark:bg-[#141214]/85"
    >
      <span
        aria-hidden="true"
        className="mr-1 h-2 w-2 shrink-0 rounded-full"
        style={{ background: "var(--accent-ui)" }}
      />
      <span className="mr-1 whitespace-nowrap font-mono text-xs text-text">
        Admin view
      </span>
      <button type="button" className={ACTION} onClick={() => setView(false)}>
        Exit
      </button>
      <button
        type="button"
        className={ACTION}
        disabled={busy}
        onClick={logout}
      >
        Log out
      </button>
    </div>
  );
};

export default AdminBar;

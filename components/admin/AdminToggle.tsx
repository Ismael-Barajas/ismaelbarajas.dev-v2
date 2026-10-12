import { useRouter } from "next/router";
import { useIsMounted } from "hooks";
import useAdmin from "hooks/useAdmin";
import { ToolTip } from "..";
import { FiEdit3 } from "react-icons/fi";
import { toggleView, useAdminView } from "lib/adminStore";
import type { ToggleStyle } from "components/library/ThemeToggle";

const BUTTON: Record<ToggleStyle, string> = {
  ghost:
    "h-9 w-9 rounded-lg text-gray-500 hover:text-text dark:text-gray-400 dark:hover:text-text",
  frosted:
    "h-9 w-9 rounded-full bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]",
  classic: "h-9 w-9 rounded-lg bg-primary text-blue-100",
};

/**
 * Turns the homepage's inline admin view on or off. Only the signed-in owner
 * sees it, and only on `/`. Sits beside the other nav toggles; the icon dims
 * while the view is off.
 */
const AdminToggle = ({ variant = "frosted" }: { variant?: ToggleStyle }) => {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const adminView = useAdminView();
  const isMounted = useIsMounted();
  if (!isAdmin || router.pathname !== "/") return null;

  const label = adminView ? "Exit admin view" : "Admin view";

  return (
    <ToolTip position="bottom" content={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={adminView}
        className={`order-2 flex cursor-pointer items-center justify-center transition-colors duration-500 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text md:order-3 ${BUTTON[variant]}`}
        onClick={toggleView}
      >
        {isMounted.current && (
          <FiEdit3
            aria-hidden="true"
            className={`h-5 w-5 transition-opacity duration-300 ${
              adminView ? "opacity-100" : "opacity-45"
            }`}
          />
        )}
      </button>
    </ToolTip>
  );
};

export default AdminToggle;

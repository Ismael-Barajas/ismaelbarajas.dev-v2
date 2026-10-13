import { FiAlertCircle, FiCheck, FiX } from "react-icons/fi";
import { dismissToast, useToasts } from "lib/toastStore";

/**
 * Stack of admin action messages, bottom centre. The live region is always
 * mounted (empty) so screen readers announce each toast as it arrives.
 */
const AdminToaster = () => {
  const toasts = useToasts();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full bg-[#E0E0E0]/90 py-1.5 pl-3 pr-1.5 text-sm text-text shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:bg-[#141214]/90"
        >
          {toast.kind === "error" ? (
            <FiAlertCircle
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
            />
          ) : (
            <FiCheck
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--accent-ui)" }}
            />
          )}
          <span className="min-w-0 break-words">
            {toast.kind === "error" && <span className="sr-only">Error: </span>}
            {toast.message}
          </span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors duration-300 hover:bg-black/[0.08] hover:text-text focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text dark:text-gray-400 dark:hover:bg-white/10"
          >
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminToaster;

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { Button, IconButton } from "components/library/Button";
import { suspendCursor } from "lib/cursorStore";

interface AdminDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Unsaved edits: closing asks for confirmation first. */
  dirty?: boolean;
  children: ReactNode;
}

/**
 * Right-side editor panel on a native <dialog>: showModal() puts it in the
 * top layer, makes the page inert and traps focus. Escape and a click on the
 * backdrop both go through `requestClose`, which confirms when dirty.
 */
const AdminDrawer = ({
  open,
  title,
  onClose,
  dirty = false,
  children,
}: AdminDrawerProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Clear a stale "Discard changes?" bar when the drawer closes.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setConfirming(false);
  }

  // The custom cursor sits under the top layer, so show the native one.
  useEffect(() => {
    if (!open) return;
    return suspendCursor();
  }, [open]);

  const requestClose = () => {
    if (dirty) setConfirming(true);
    else onClose();
  };

  const titleId = "admin-drawer-title";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) requestClose();
      }}
      className="admin-drawer fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-[min(32rem,100vw)] max-w-none overflow-hidden rounded-l-2xl bg-[#E0E0E0]/85 p-0 text-text shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl backdrop:bg-black/30 backdrop:backdrop-blur-sm dark:bg-[#141214]/85"
    >
      {open && (
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-3 px-5 py-4">
            <h2
              id={titleId}
              className="font-display text-xl font-black text-text"
            >
              {title}
            </h2>
            <IconButton aria-label="Close editor" onClick={requestClose}>
              <FiX className="h-5 w-5" aria-hidden="true" />
            </IconButton>
          </header>
          {confirming && (
            <div
              role="alertdialog"
              aria-label="Discard changes?"
              className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/[0.06] px-4 py-3 text-sm dark:bg-white/10"
            >
              <span className="font-medium">Discard changes?</span>
              <span className="flex gap-2">
                <Button variant="primary" onClick={onClose}>
                  Discard
                </Button>
                <Button onClick={() => setConfirming(false)} autoFocus>
                  Keep editing
                </Button>
              </span>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-1">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
};

export default AdminDrawer;

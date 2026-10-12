import { useEffect, useRef, useState, type PointerEvent } from "react";
import clsx from "clsx";
import { FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { IconButton } from "components/library/Button";
import { DragHandle, type DragHandleProps } from "./SortableList";

export interface AdminItemToolbarProps {
  /** Drag activator from SortableList; omit for items that can't be moved. */
  handle?: DragHandleProps;
  /** Item name, used in the aria-labels ("Edit GM"). */
  label: string;
  onEdit: () => void;
  onDelete: () => Promise<void> | void;
  className?: string;
}

const CONFIRM_MS = 4000;

/** Keeps a press on a button from reaching a drag listener above it. */
const stopDrag = (e: PointerEvent) => e.stopPropagation();

/**
 * Small frosted pill with the per-item admin actions: reorder grip, edit,
 * and delete. Delete asks first, inline: the button swaps for "Delete?" with
 * confirm and cancel, which cancels itself after four seconds or on Escape.
 */
const AdminItemToolbar = ({
  handle,
  label,
  onEdit,
  onDelete,
  className,
}: AdminItemToolbarProps) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirming) return;
    // Land on the safe choice so a stray Enter doesn't delete.
    barRef.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirming]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label={`${label} actions`}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-[#E0E0E0]/85 p-1 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:bg-[#141214]/85",
        className,
      )}
    >
      {handle && !confirming && <DragHandle handle={handle} label={label} />}
      {confirming ? (
        <>
          <span
            role="alert"
            className="px-2 text-xs font-medium text-red-700 dark:text-red-300"
          >
            Delete?
          </span>
          <IconButton
            size="sm"
            aria-label={`Confirm delete ${label}`}
            variant="primary"
            disabled={busy}
            onPointerDown={stopDrag}
            onClick={confirmDelete}
          >
            <FiCheck aria-hidden="true" className="h-4 w-4" />
          </IconButton>
          <IconButton
            data-cancel=""
            size="sm"
            aria-label={`Cancel delete ${label}`}
            disabled={busy}
            onPointerDown={stopDrag}
            onClick={() => setConfirming(false)}
          >
            <FiX aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        </>
      ) : (
        <>
          <IconButton
            size="sm"
            aria-label={`Edit ${label}`}
            onPointerDown={stopDrag}
            onClick={onEdit}
          >
            <FiEdit2 aria-hidden="true" className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            aria-label={`Delete ${label}`}
            onPointerDown={stopDrag}
            onClick={() => setConfirming(true)}
          >
            <FiTrash2 aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        </>
      )}
    </div>
  );
};

export default AdminItemToolbar;

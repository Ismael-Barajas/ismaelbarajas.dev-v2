import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { SortableList as SortableListType } from "./SortableList";

/**
 * Admin-only pieces, split into their own chunks so visitors never download
 * dnd-kit or the toolbars. Rendered only while the admin view is on (the
 * ids they need exist only for an admin), and AdminLayer preloads them.
 */
export const SortableList = dynamic(() => import("./SortableList"), {
  ssr: false,
}) as unknown as typeof SortableListType;

export const AdminItemToolbar: ComponentType<
  import("./AdminItemToolbar").AdminItemToolbarProps
> = dynamic(() => import("./AdminItemToolbar"), { ssr: false });

export const AddButton: ComponentType<import("./AddButton").AddButtonProps> =
  dynamic(() => import("./AddButton"), { ssr: false });

/** Starts the downloads so the first toggle of the admin view has no gap. */
export const preloadAdminChunks = () => {
  void import("./SortableList");
  void import("./AdminItemToolbar");
  void import("./AddButton");
};

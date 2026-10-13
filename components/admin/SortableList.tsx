import {
  useId,
  type KeyboardEventHandler,
  type PointerEventHandler,
  type ReactNode,
} from "react";
import clsx from "clsx";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGripVertical } from "react-icons/lu";

/**
 * Everything that makes an element the drag activator for one item. Flat, so
 * it spreads straight onto a `<button>` (see DragHandle) or onto a whole
 * element such as a fact chip: `<span {...handle}>`. Includes `ref`, which
 * React 19 passes through as an ordinary prop.
 */
export interface DragHandleProps extends DraggableAttributes {
  ref: (element: HTMLElement | null) => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

type Id = number | string;

/**
 * `items` with the one under `activeId` moved to where `overId` sits, or
 * null when nothing changed (dropped outside the list, or in place).
 */
export function moveItem<T extends { id: Id }>(
  items: T[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | null | undefined,
): T[] | null {
  if (overId == null || overId === activeId) return null;
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1 || from === to) return null;
  return arrayMove(items, from, to);
}

/** What screen readers hear while an item is moved. Positions are 1-based. */
export const sortMessages = {
  pickedUp: (label: string, position: number, total: number) =>
    `Picked up ${label}, at position ${position} of ${total}.`,
  moved: (label: string, position: number, total: number) =>
    `${label} moved to position ${position} of ${total}.`,
  outside: (label: string) => `${label} is no longer over the list.`,
  dropped: (label: string, position: number, total: number) =>
    `${label} dropped at position ${position} of ${total}.`,
  cancelled: (label: string) => `Moving ${label} was cancelled.`,
};

const screenReaderInstructions = {
  draggable:
    "To pick up an item, press space or enter. Use the arrow keys to move it, then press space or enter again to drop it, or escape to cancel.",
};

const DRAGGING =
  "relative z-10 opacity-90 drop-shadow-[0_18px_28px_rgba(0,0,0,0.28)]";

function SortableItem({
  id,
  as: Tag,
  className,
  children,
}: {
  id: Id;
  as: "div" | "li";
  className?: string;
  children: (handle: DragHandleProps, isDragging: boolean) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const handle: DragHandleProps = {
    ...attributes,
    ...(listeners as Pick<DragHandleProps, "onPointerDown" | "onKeyDown">),
    ref: setActivatorNodeRef,
  };
  // Translate, not Transform: cards of different heights would otherwise be
  // scaled to each other's size as they swap.
  const ItemTag = Tag as "div";
  return (
    <ItemTag
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={clsx(className, isDragging && DRAGGING)}
    >
      {children(handle, isDragging)}
    </ItemTag>
  );
}

/**
 * Drag-and-drop reordering for a list or grid (dnd-kit). Each item is
 * wrapped in an `itemAs` element (the node that moves); `renderItem` gets a
 * DragHandleProps to put on a DragHandle or on the element itself. Pointer
 * drags start after 4px so clicks inside an item still work; the keyboard
 * works through the handle (space to pick up, arrows, space to drop).
 */
export function SortableList<T extends { id: Id }>({
  items,
  strategy,
  onReorder,
  getLabel,
  renderItem,
  className,
  as = "div",
  itemAs = "div",
  itemClassName,
}: {
  items: T[];
  strategy: "vertical" | "grid";
  onReorder: (next: T[]) => void;
  /** Spoken name of an item, for screen-reader announcements. */
  getLabel: (item: T) => string;
  renderItem: (item: T, handle: DragHandleProps, isDragging: boolean) => ReactNode;
  /** Classes for the wrapper (e.g. the list or grid layout). */
  className?: string;
  as?: "div" | "ol" | "ul";
  itemAs?: "div" | "li";
  /** Classes for each item's wrapper element. */
  itemClassName?: string;
}) {
  // A stable id keeps dnd-kit's aria-describedby ids the same on the server
  // and the client.
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const total = items.length;
  const indexOf = (itemId: UniqueIdentifier) =>
    items.findIndex((item) => item.id === itemId);
  const labelOf = (itemId: UniqueIdentifier) => {
    const item = items[indexOf(itemId)];
    return item ? getLabel(item) : "Item";
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      sortMessages.pickedUp(labelOf(active.id), indexOf(active.id) + 1, total),
    onDragOver: ({ active, over }) =>
      over
        ? sortMessages.moved(labelOf(active.id), indexOf(over.id) + 1, total)
        : sortMessages.outside(labelOf(active.id)),
    onDragEnd: ({ active, over }) =>
      over
        ? sortMessages.dropped(labelOf(active.id), indexOf(over.id) + 1, total)
        : sortMessages.cancelled(labelOf(active.id)),
    onDragCancel: ({ active }) => sortMessages.cancelled(labelOf(active.id)),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const next = moveItem(items, active.id, over?.id);
    if (next) onReorder(next);
  };

  const Wrapper = as as "div";
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={
          strategy === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        <Wrapper className={className}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              as={itemAs}
              className={itemClassName}
            >
              {(handle, isDragging) => renderItem(item, handle, isDragging)}
            </SortableItem>
          ))}
        </Wrapper>
      </SortableContext>
    </DndContext>
  );
}

/** The grip button that starts a drag; small and frosted like IconButton. */
export function DragHandle({
  handle,
  label,
  className,
}: {
  handle: DragHandleProps;
  label: string;
  className?: string;
}) {
  return (
    <button
      {...handle}
      type="button"
      aria-label={`Reorder ${label}`}
      className={clsx(
        "inline-flex h-8 w-8 shrink-0 touch-none cursor-grab select-none items-center justify-center rounded-full bg-black/[0.08] text-text backdrop-blur-md transition-colors duration-300 ease-out hover:bg-black/[0.14] focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text active:cursor-grabbing dark:bg-white/10 dark:hover:bg-white/[0.16]",
        className,
      )}
    >
      <LuGripVertical aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

export default SortableList;

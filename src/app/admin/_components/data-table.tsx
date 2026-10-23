"use client";

import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/content";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { toast } from "sonner";
import { TableSortBar, verticalOnly } from "./table-sort";

export { TablePagination } from "./table-pagination";
export { TableSortBar } from "./table-sort";

/**
 * Admin list table: toolbar, column header, rows and footer in one card.
 * Columns hide by the width of the table itself (container queries), so they
 * adapt to the sidebar layout too, not only to the screen size. With `reorder`,
 * rows can be dragged by their handle (mouse, touch or keyboard) and the new
 * order is saved straight away.
 */

type Breakpoint = "sm" | "md" | "lg" | "xl";

export type DataColumn = {
  key: string;
  label: ReactNode;
  /** CSS grid track, e.g. "minmax(0,1fr)" or "8rem". */
  width: string;
  /** Hide the column while the table is narrower than this. */
  hideBelow?: Breakpoint;
  align?: "start" | "end" | "center";
};

export type DataRow = {
  id: string;
  /** Plain-text name, used for screen readers ("Reorder Restaurant dashboard"). */
  label: string;
  cells: Record<string, ReactNode>;
  actions?: ReactNode;
  dimmed?: boolean;
};

// Must match the @container widths in globals.css (.data-table-grid).
const LEVELS: (Breakpoint | "base")[] = ["base", "sm", "md", "lg", "xl"];
const HIDE_CLASS: Record<Breakpoint, string> = {
  sm: "hidden @xl:flex",
  md: "hidden @3xl:flex",
  lg: "hidden @4xl:flex",
  xl: "hidden @5xl:flex",
};
const ALIGN_CLASS = { start: "justify-start text-left", end: "justify-end text-right", center: "justify-center text-center" };

function gridTemplates(columns: DataColumn[], sortable: boolean, actionsWidth: string | null) {
  const style: Record<string, string> = {};
  LEVELS.forEach((level, index) => {
    const tracks = columns
      .filter((column) => !column.hideBelow || LEVELS.indexOf(column.hideBelow) <= index)
      .map((column) => column.width);
    style[`--dt-${index}`] = [sortable ? "2rem" : null, ...tracks, actionsWidth].filter(Boolean).join(" ");
  });
  return style as CSSProperties;
}

function Cells({ columns, row }: { columns: DataColumn[]; row: DataRow }) {
  return columns.map((column) => (
    <div
      key={column.key}
      role="cell"
      className={cn("min-w-0 items-center", column.hideBelow ? HIDE_CLASS[column.hideBelow] : "flex", ALIGN_CLASS[column.align ?? "start"])}
    >
      <div className="w-full min-w-0">{row.cells[column.key]}</div>
    </div>
  ));
}

const ROW_CLASS =
  "data-table-grid relative border-b border-border px-3 py-3 transition-colors last:border-b-0 hover:bg-muted/30 sm:px-4";

function StaticRow({ columns, row }: { columns: DataColumn[]; row: DataRow }) {
  return (
    <div role="row" className={cn(ROW_CLASS, row.dimmed && "opacity-70")}>
      <Cells columns={columns} row={row} />
      {row.actions && (
        <div role="cell" className="flex items-center justify-end gap-1">
          {row.actions}
        </div>
      )}
    </div>
  );
}

function SortableRow({ columns, row, disabled }: { columns: DataColumn[]; row: DataRow; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled });
  return (
    <div
      ref={setNodeRef}
      role="row"
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        ROW_CLASS,
        row.dimmed && "opacity-70",
        isDragging && "z-20 rounded-[4px] border-transparent bg-card shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)] ring-1 ring-primary/40"
      )}
    >
      <div role="cell" className="flex items-center">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`Reorder ${row.label}`}
          className={cn(
            "grid size-8 touch-none place-items-center rounded-[4px] text-muted-foreground/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing",
            isDragging && "bg-primary/10 text-primary"
          )}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <Cells columns={columns} row={row} />
      {row.actions && (
        <div role="cell" className="flex items-center justify-end gap-1">
          {row.actions}
        </div>
      )}
    </div>
  );
}

export function DataTable({
  label,
  columns,
  rows,
  reorder,
  reorderUnavailable,
  toolbar,
  footer,
  empty,
  actionsWidth = "2.5rem",
  wide = false,
}: {
  /** Accessible name of the table, e.g. "Projects". */
  label: string;
  columns: DataColumn[];
  rows: DataRow[];
  /** Saves a new order (ids of the rows shown). Enables drag handles. */
  reorder?: (ids: string[]) => Promise<ActionResult<unknown>>;
  /** Why dragging is off right now (e.g. a search is active). Shown instead of the drag hint. */
  reorderUnavailable?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  /** Shown in the table body when there are no rows. */
  empty?: ReactNode;
  /** Grid track for the actions column; null when rows have no actions. */
  actionsWidth?: string | null;
  /**
   * For tables with many columns: from the lg breakpoint the table keeps a
   * comfortable width and scrolls sideways inside its card instead of
   * squeezing every column. Narrower than that it hides columns as usual.
   */
  wide?: boolean;
}) {
  const router = useRouter();
  // Stable id for dnd-kit's accessibility attributes, so server and browser HTML match.
  const dndId = useId();
  const sortable = Boolean(reorder);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  // Local order for instant feedback while the server saves; reset whenever the rows change.
  const rowsKey = rows.map((row) => row.id).join(",");
  const [order, setOrder] = useState(() => rows.map((row) => row.id));
  const [orderKey, setOrderKey] = useState(rowsKey);
  if (orderKey !== rowsKey) {
    setOrderKey(rowsKey);
    setOrder(rows.map((row) => row.id));
  }
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = order.map((id) => byId.get(id)).filter((row): row is DataRow => Boolean(row));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!reorder || !over || active.id === over.id) return;
    const previous = order;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    setOrder(next);
    setSaved(false);
    startSaving(async () => {
      try {
        const result = await reorder(next);
        if (!result.ok) {
          setOrder(previous);
          toast.error(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch {
        setOrder(previous);
        toast.error("Could not save the new order. Please try again.");
      }
    });
  };

  const templates = gridTemplates(columns, sortable, rows.some((row) => row.actions) ? actionsWidth : null);
  const showDragBar = rows.length > 1 && (sortable || reorderUnavailable);

  const body =
    ordered.length === 0 ? (
      <div className="px-4 py-2">{empty}</div>
    ) : sortable ? (
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {ordered.map((row) => (
            <SortableRow key={row.id} columns={columns} row={row} disabled={saving} />
          ))}
        </SortableContext>
      </DndContext>
    ) : (
      ordered.map((row) => <StaticRow key={row.id} columns={columns} row={row} />)
    );

  return (
    <div className="@container min-w-0 overflow-hidden rounded-[4px] border border-border bg-card shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)]" style={templates}>
      {toolbar && <div className="flex flex-col gap-3 border-b border-border p-3 @3xl:flex-row @3xl:items-center @3xl:justify-between sm:p-4">{toolbar}</div>}

      {showDragBar && (
        <TableSortBar
          sortable={sortable}
          reorderUnavailable={reorderUnavailable}
          saving={saving}
          saved={saved}
        />
      )}

      {/* Focusable so the sideways scroll is reachable without a mouse or trackpad. */}
      <div
        className={cn(wide && "overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
        {...(wide ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}
      >
        {/* When wide, column hiding follows the table's own (scrollable) width rather than the card's. */}
        <div role="table" aria-label={label} className={cn(wide && "@container min-w-0 min-w-[85rem]")}>
          {ordered.length > 0 && (
            <div role="row" className="data-table-grid border-b border-border bg-muted/40 px-3 py-2.5 sm:px-4">
              {sortable && <div role="columnheader" aria-label="Reorder" />}
              {columns.map((column) => (
                <div
                  key={column.key}
                  role="columnheader"
                  className={cn(
                    "min-w-0 items-center text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground",
                    column.hideBelow ? HIDE_CLASS[column.hideBelow] : "flex",
                    ALIGN_CLASS[column.align ?? "start"]
                  )}
                >
                  {column.label}
                </div>
              ))}
              {rows.some((row) => row.actions) && (
                <div role="columnheader">
                  <span className="sr-only">Actions</span>
                </div>
              )}
            </div>
          )}
          <div role="rowgroup">{body}</div>
        </div>
      </div>

      {footer && <div className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">{footer}</div>}
    </div>
  );
}

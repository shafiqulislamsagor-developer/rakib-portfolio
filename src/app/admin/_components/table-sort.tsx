"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import type { Modifier } from "@dnd-kit/core";
import { Check, GripVertical, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export interface TableSortBarProps {
  sortable: boolean;
  reorderUnavailable?: string;
  saving: boolean;
  saved: boolean;
}

/**
 * Informational status and drag indicator bar for reorderable data tables.
 */
export function TableSortBar({
  sortable,
  reorderUnavailable,
  saving,
  saved,
}: TableSortBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/[.04] px-3 py-2 text-xs text-muted-foreground sm:px-4">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {sortable ? <GripVertical className="size-3.5 shrink-0 text-primary" /> : <Info className="size-3.5 shrink-0" />}
        <span className="truncate">
          {sortable ? "Drag the handle to reorder — saved automatically." : reorderUnavailable}
        </span>
      </span>
      {sortable && (saving || saved) && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 font-medium",
            saving ? "text-muted-foreground" : "text-mist dark:text-mist"
          )}
          aria-live="polite"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {saving ? "Saving…" : "Order saved"}
        </span>
      )}
    </div>
  );
}

export interface SortableRowHandleProps {
  id: string;
  label: string;
  disabled: boolean;
}

/**
 * Handle button for sortable table rows.
 */
export function SortableRowHandle({
  id,
  label,
  disabled,
}: SortableRowHandleProps) {
  const { attributes, listeners, setActivatorNodeRef, isDragging } = useSortable({ id, disabled });

  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      disabled={disabled}
      aria-label={`Reorder ${label}`}
      className={cn(
        "grid size-8 touch-none place-items-center rounded-[4px] text-muted-foreground/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing",
        isDragging && "bg-primary/10 text-primary"
      )}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

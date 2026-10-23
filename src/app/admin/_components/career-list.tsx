import { deleteCareerItem, reorderCareerItems, setCareerItemStatus } from "@/app/admin/_actions/career";
import { DataTable } from "@/app/admin/_components/data-table";
import { RowActions } from "@/app/admin/_components/row-actions";
import { EmptyState, FilterTabs, StatusBadge } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import Link from "next/link";

export type CareerRow = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: "active" | "archived";
  badge?: string;
};

const LIST_LABELS = { experience: "Experience", education: "Education", service: "Services", testimonial: "Testimonials", faq: "FAQs" } as const;

/** Ordered list for services, experience, education, testimonials and FAQs — drag to reorder. */
export default function CareerList({
  kind,
  basePath,
  rows,
  status,
  counts,
  icon: Icon,
  emptyTitle,
  emptyDescription,
}: {
  kind: "experience" | "education" | "service" | "testimonial" | "faq";
  basePath: string;
  rows: CareerRow[];
  status: "active" | "archived";
  counts: { active: number; archived: number };
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <DataTable
      label={LIST_LABELS[kind]}
      reorder={reorderCareerItems.bind(null, kind)}
      toolbar={
        <FilterTabs
          items={[
            { label: "Active", href: basePath, active: status === "active", count: counts.active },
            { label: "Archived", href: `${basePath}?status=archived`, active: status === "archived", count: counts.archived },
          ]}
        />
      }
      columns={[
        { key: "item", label: "Item", width: "minmax(0,1fr)" },
        { key: "status", label: "Status", width: "9rem", hideBelow: "sm", align: "end" },
      ]}
      rows={rows.map((row) => ({
        id: row.id,
        label: row.title,
        dimmed: row.status === "archived",
        cells: {
          item: (
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary @md:grid">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <Link href={`${basePath}/${row.id}`} className="block truncate font-medium hover:text-primary">
                  {row.title}
                </Link>
                {row.subtitle && <p className="truncate text-sm text-muted-foreground">{row.subtitle}</p>}
                {row.meta && <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{row.meta}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1.5 @xl:hidden">
                  {row.badge && <StatusBadge status="live" label={row.badge} />}
                  <StatusBadge status={row.status} />
                </div>
              </div>
            </div>
          ),
          status: (
            <span className="flex flex-wrap justify-end gap-1.5">
              {row.badge && <StatusBadge status="live" label={row.badge} />}
              <StatusBadge status={row.status} />
            </span>
          ),
        },
        actions: (
          <RowActions
            label={`Actions for ${row.title}`}
            actions={[
              { type: "link", label: "Edit", icon: "edit", href: `${basePath}/${row.id}` },
              { type: "separator" },
              row.status === "active"
                ? { type: "action", label: "Archive", icon: "archive", action: setCareerItemStatus.bind(null, kind, row.id, "archived") }
                : { type: "action", label: "Restore", icon: "restore", action: setCareerItemStatus.bind(null, kind, row.id, "active") },
              {
                type: "action",
                label: "Delete",
                icon: "delete",
                destructive: true,
                action: deleteCareerItem.bind(null, kind, row.id),
                confirm: { title: `Delete “${row.title}”?`, description: "This cannot be undone. Archive it to hide it instead.", confirmLabel: "Delete" },
              },
            ]}
          />
        ),
      }))}
      empty={
        <EmptyState
          icon={Icon}
          title={status === "archived" ? "Nothing archived" : emptyTitle}
          description={status === "archived" ? undefined : emptyDescription}
          action={
            status === "active" ? (
              <Button asChild>
                <Link href={`${basePath}/new`}>
                  <Plus /> Add entry
                </Link>
              </Button>
            ) : undefined
          }
        />
      }
      footer={
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{rows.length}</span> {status} item{rows.length === 1 ? "" : "s"}
        </p>
      }
    />
  );
}

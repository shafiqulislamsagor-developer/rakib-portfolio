import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RangePicker } from "@/app/admin/_components/range-picker";
import { TrafficChart } from "@/app/admin/_components/charts";
import { FilterTabs, Panel } from "@/app/admin/_components/ui";

const number = new Intl.NumberFormat("en");

/**
 * Ranked magnitudes as labeled horizontal bars (single series, one hue).
 * Every row carries its value as text, so the list doubles as its own table.
 */
export function BarList({
  items,
  empty = "No data for this period.",
  linkable = false,
}: {
  items: { label: string; value: number; href?: string }[];
  empty?: string;
  linkable?: boolean;
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            {linkable && item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer" className="min-w-0 truncate hover:text-primary" title={item.label}>
                {item.label}
              </a>
            ) : (
              <span className="min-w-0 truncate" title={item.label}>
                {item.label}
              </span>
            )}
            <span className="shrink-0 tabular-nums text-muted-foreground">{number.format(item.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-[var(--viz-1)]" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * CSV download button for reports.
 */
export function ExportButton({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <Download className="size-4" /> {label}
      </a>
    </Button>
  );
}

/**
 * Date range picker and granularity selector header.
 */
export function DateRangeSelector({
  basePath = "/admin/analytics",
  preset,
  from,
  to,
  granularity,
  rangeParams,
}: {
  basePath?: string;
  preset: string;
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  rangeParams: Record<string, string>;
}) {
  const granularityHref = (value: string) =>
    `${basePath}?${new URLSearchParams({ ...rangeParams, granularity: value })}`;

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <RangePicker basePath={basePath} preset={preset} from={from} to={to} extra={{ granularity }} />
      <FilterTabs
        items={(["day", "week", "month"] as const).map((value) => ({
          label: value === "day" ? "Daily" : value === "week" ? "Weekly" : "Monthly",
          href: granularityHref(value),
          active: granularity === value,
        }))}
      />
    </div>
  );
}

/**
 * Interactive visitor and page-view traffic charts.
 */
export function AnalyticsCharts({
  totals,
  series,
  granularity,
}: {
  totals: { pageview: number };
  series: { bucket: string; pageview: number; visitor: number }[];
  granularity: "day" | "week" | "month";
}) {
  return (
    <Panel
      title="Visitor & page-view trend"
      description={`${granularity === "day" ? "Daily" : granularity === "week" ? "Weekly (weeks start Monday)" : "Monthly"} totals`}
      className="mt-6"
    >
      {totals.pageview === 0 ? (
        <p className="grid h-72 place-items-center text-sm text-muted-foreground">
          No visits recorded in this period.
        </p>
      ) : (
        <TrafficChart data={series} granularity={granularity} className="aspect-auto h-80 w-full" />
      )}
    </Panel>
  );
}

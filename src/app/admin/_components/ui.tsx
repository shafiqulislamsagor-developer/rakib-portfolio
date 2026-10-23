import { ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The shared vocabulary of every admin page, in the language of the public
 * site: the "/     Label" eyebrow, oversized light-grey headings, 4px corners,
 * hairline frames and white as the only accent.
 */

/** Section eyebrow. The spacing inside the string is part of the design. */
export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn("text-[11px] tracking-[1.26px] whitespace-pre text-g3 uppercase", className)}>{`/     ${children}`}</p>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span className="mt-1 hidden size-11 shrink-0 place-items-center rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.03] text-g4 sm:grid">
            <Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[32px] leading-[1.15] tracking-[-0.96px] text-g1 sm:text-[40px] sm:tracking-[-1.2px]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[14px] leading-[22px] text-g2">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  id?: string;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("min-w-0 rounded-[4px] border border-[#4e4e4e]/40 bg-white/[0.015]", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#4e4e4e]/40 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] text-g4">{title}</h2>}
            {description && <p className="mt-1 text-[12px] leading-[18px] text-g2">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-[4px] border border-dashed border-[#4e4e4e]/50 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.03] text-g2">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-[18px] text-g4">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[14px] leading-[21px] text-g2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/*
 * Status is carried by weight rather than hue: live things are white, drafts
 * and waiting things grey, and only the destructive end of the scale takes the
 * one colour in the palette.
 */
const STATUS_STYLES: Record<string, string> = {
  published: "border-white/50 bg-white/[0.12] text-mist",
  active: "border-white/50 bg-white/[0.12] text-mist",
  replied: "border-white/50 bg-white/[0.12] text-mist",
  live: "border-white/50 bg-white/[0.12] text-mist",
  scheduled: "border-g1/50 bg-white/[0.06] text-g4",
  unread: "border-g1/50 bg-white/[0.06] text-g4",
  draft: "border-[#4e4e4e] text-g2",
  pending: "border-[#4e4e4e] text-g2",
  archived: "border-[#4e4e4e]/60 text-g3",
  spam: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase",
        STATUS_STYLES[status] ?? "border-[#4e4e4e]/60 text-g2",
      )}
    >
      {label ?? status}
    </span>
  );
}

// Status dot in filter tabs, matched by tab label.
const TAB_DOTS: Record<string, string> = {
  published: "bg-white",
  active: "bg-white",
  replied: "bg-white",
  live: "bg-white",
  "online now": "bg-white",
  unread: "bg-g1",
  scheduled: "bg-g1",
  draft: "bg-g2",
  pending: "bg-g2",
  "awaiting reply": "bg-g2",
  archived: "bg-g3",
  spam: "bg-destructive",
};

/** Segmented status filter (links, so it works without JavaScript). Scrolls sideways on narrow screens. */
export function FilterTabs({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <div className="-mx-1 min-w-0 overflow-x-auto px-1 py-0.5 no-scrollbar">
      <div className="inline-flex gap-1 rounded-[4px] border border-[#4e4e4e]/40 bg-white/[0.02] p-1" role="tablist">
        {items.map((item) => {
          const dot = TAB_DOTS[item.label.toLowerCase()];
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={item.active}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-[4px] px-3 py-1.5 text-[13px] whitespace-nowrap transition-[background-color,color] duration-300 ease-figma-out",
                item.active ? "bg-white/[0.1] text-mist" : "text-g2 hover:bg-white/[0.04] hover:text-g4",
              )}
            >
              {dot && <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />}
              {item.label}
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "min-w-5 rounded-[4px] px-1.5 py-px text-center text-[11px] tabular-nums",
                    item.active ? "bg-white text-ink" : "bg-white/[0.07] text-g2",
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** GET search form; preserves the other query parameters. */
export function SearchBox({
  action,
  defaultValue,
  placeholder = "Search…",
  hidden = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} method="get" role="search" className="relative w-full shrink-0 sm:w-72">
      {Object.entries(hidden).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-g2" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-[4px] border border-[#4e4e4e]/60 bg-white/[0.02] pr-3 pl-9 text-[14px] text-mist transition-colors duration-300 outline-none placeholder:text-g2/70 focus:border-white/70 focus:bg-white/[0.04]"
      />
      {defaultValue && (
        <Link
          href={(() => {
            const search = new URLSearchParams();
            for (const [name, value] of Object.entries(hidden)) if (value) search.set(name, value);
            const query = search.toString();
            return query ? `${action}?${query}` : action;
          })()}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-[4px] px-1.5 py-0.5 text-[11px] text-g2 uppercase transition-colors hover:text-mist"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

/** Page numbers with gaps: 1 … 4 5 6 … 12 */
function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index > 0 && value - sorted[index - 1] > 1 ? (["gap", value] as const) : [value]));
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize = 20,
  href,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  href: (page: number) => string;
  className?: string;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const summary = (
    <p className="text-[12px] text-g2">
      {total === 0 ? (
        "No items"
      ) : (
        <>
          Showing{" "}
          <span className="text-g4 tabular-nums">
            {first}–{last}
          </span>{" "}
          of <span className="text-g4 tabular-nums">{total}</span>
        </>
      )}
    </p>
  );
  if (pageCount <= 1) return <div className={cn("mt-4", className)}>{summary}</div>;

  return (
    <nav aria-label="Pagination" className={cn("mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {summary}
      <div className="flex items-center gap-1">
        <PageLink disabled={page <= 1} href={href(page - 1)} label="Previous page">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </PageLink>
        {pageNumbers(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-[12px] text-g3" aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={href(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "grid size-8 place-items-center rounded-[4px] text-[12px] tabular-nums transition-colors duration-300 ease-figma-out",
                item === page ? "bg-white text-ink" : "text-g2 hover:bg-white/[0.06] hover:text-mist",
              )}
            >
              {item}
            </Link>
          ),
        )}
        <PageLink disabled={page >= pageCount} href={href(page + 1)} label="Next page">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({ disabled, href, label, children }: { disabled: boolean; href: string; label: string; children: ReactNode }) {
  const className =
    "inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#4e4e4e]/60 px-2.5 text-[11px] tracking-[0.4px] uppercase";
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(className, "text-g3 opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(className, "text-g2 transition-colors duration-300 ease-figma-out hover:border-white hover:bg-white hover:text-ink")}
    >
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  href?: string;
  trend?: number | null;
}) {
  const body = (
    <div className="flex h-full flex-col rounded-[4px] border border-[#4e4e4e]/40 bg-white/[0.015] p-4 transition-colors duration-300 ease-figma-out hover:border-[#4e4e4e] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] tracking-[0.9px] text-g2 uppercase">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-[4px] border border-[#4e4e4e]/60 text-g2">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-[28px] leading-none tracking-[-0.84px] text-g1 tabular-nums sm:text-[32px]">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-g2">
        {typeof trend === "number" && Number.isFinite(trend) && (
          <span className={trend >= 0 ? "text-mist" : "text-destructive"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(Math.round(trend))}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-[4px] outline-none focus-visible:ring-1 focus-visible:ring-white/70">
      {body}
    </Link>
  ) : (
    body
  );
}

export function DbNotConfigured() {
  return (
    <div className="rounded-[4px] border border-destructive/40 bg-destructive/[0.08] p-5 text-[14px] leading-[22px] text-destructive">
      The database is not configured. Set <code className="text-mist">MONGODB_URI</code> in your environment, then run{" "}
      <code className="text-mist">pnpm db:seed</code>.
    </div>
  );
}

export function buildHref(base: string, params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && !(key === "page" && value === 1)) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

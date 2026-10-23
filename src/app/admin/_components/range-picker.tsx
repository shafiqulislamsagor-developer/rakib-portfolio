"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";

const PRESETS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "365d", label: "12 months" },
];

/** "YYYY-MM-DD" → local Date (no time-zone shift). */
function parseDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

function rangeLabel(from: Date, to: Date) {
  if (from.getFullYear() !== to.getFullYear()) return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
}

/**
 * Date range for dashboards: preset buttons plus a calendar popover with quick
 * ranges. Everything is a URL (`?range=30d` or `?from=…&to=…`), so reports stay
 * shareable and the back button works.
 */
export function RangePicker({
  basePath,
  preset,
  from,
  to,
  extra = {},
}: {
  basePath: string;
  preset: string;
  from: string;
  to: string;
  extra?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const [pending, startTransition] = useTransition();

  const query = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...extra, ...params })) if (value) search.set(key, value);
    return `${basePath}?${search}`;
  };

  const today = new Date();
  const quick = [
    { label: "Last 14 days", from: subDays(today, 13), to: today },
    { label: "This month", from: startOfMonth(today), to: today },
    { label: "Last month", from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) },
    { label: "Last 6 months", from: subMonths(today, 6), to: today },
  ];

  const go = (href: string) => {
    setOpen(false);
    startTransition(() => router.push(href));
  };
  const applyRange = (range: DateRange | undefined) => {
    if (!range?.from) return;
    go(query({ from: dayKey(range.from), to: dayKey(range.to ?? range.from) }));
  };

  const currentFrom = parseDay(from);
  const currentTo = parseDay(to);
  const selectedDays = draft?.from ? differenceInCalendarDays(draft.to ?? draft.from, draft.from) + 1 : 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="-mx-1 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-1 rounded-[4px] border border-border bg-muted/50 p-1" role="group" aria-label="Date range presets">
          {PRESETS.map((item) => (
            <Link
              key={item.value}
              href={query({ range: item.value })}
              aria-current={preset === item.value ? "true" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow]",
                preset === item.value
                  ? "bg-white/[0.1] text-mist"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraft({ from: currentFrom, to: currentTo });
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-full items-center gap-2 rounded-[4px] border bg-background px-3 text-sm font-medium transition-colors sm:w-auto",
              preset === "custom" ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
            aria-label="Choose a custom date range"
          >
            {pending ? <Loader2 className="size-4 animate-spin text-primary" /> : <CalendarDays className="size-4 text-primary" />}
            <span className="truncate">{rangeLabel(currentFrom, currentTo)}</span>
            <span className="ml-auto rounded-[4px] bg-muted px-1.5 py-px text-[11px] font-semibold tabular-nums text-muted-foreground sm:ml-1">
              {differenceInCalendarDays(currentTo, currentFrom) + 1}d
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[4px] p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-40 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
              <p className="hidden px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground sm:block">Quick ranges</p>
              {quick.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setDraft({ from: item.from, to: item.to })}
                  className="shrink-0 whitespace-nowrap rounded-[4px] px-2.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div>
              <Calendar
                mode="range"
                selected={draft}
                onSelect={setDraft}
                numberOfMonths={isMobile ? 1 : 2}
                defaultMonth={isMobile ? currentTo : subMonths(currentTo, 1)}
                disabled={{ after: today }}
                autoFocus
              />
              <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {draft?.from ? (
                    <>
                      <span className="font-medium text-foreground">{rangeLabel(draft.from, draft.to ?? draft.from)}</span> · {selectedDays} day
                      {selectedDays === 1 ? "" : "s"}
                    </>
                  ) : (
                    "Pick a start and an end date"
                  )}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" disabled={!draft?.from} onClick={() => applyRange(draft)}>
                    Apply range
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type FilterOption = { value: string; label: string; count?: number };

/**
 * A dropdown that navigates: the chosen value becomes a query parameter, so
 * every filtered view is a shareable URL and the back button works. Rendering
 * a native <select> keeps it usable on a phone and with a screen reader.
 */
export function FilterSelect({
  name,
  label,
  value,
  options,
  basePath,
  params = {},
  className,
}: {
  /** Query parameter this dropdown sets. */
  name: string;
  /** Accessible name, e.g. "Filter by device". */
  label: string;
  value: string;
  options: FilterOption[];
  basePath: string;
  /** The other query parameters to keep. `name` and `page` are replaced. */
  params?: Record<string, string | number | undefined | null>;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const href = (next: string) => {
    const search = new URLSearchParams();
    for (const [key, entry] of Object.entries(params)) {
      if (key !== name && key !== "page" && entry !== undefined && entry !== null && entry !== "") search.set(key, String(entry));
    }
    if (next) search.set(name, next);
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const target = href(event.target.value);
          startTransition(() => router.push(target));
        }}
        className="h-9 w-full cursor-pointer appearance-none rounded-[4px] border border-input bg-background pl-3 pr-8 text-sm outline-none transition-[border-color,box-shadow] focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4" />}
      </span>
    </div>
  );
}

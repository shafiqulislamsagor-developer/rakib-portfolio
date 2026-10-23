import { cn } from "@/lib/utils";
import { ArrowRight, Check, CircleDashed } from "lucide-react";
import Link from "next/link";

export type ChecklistItem = {
  label: string;
  /** Why it matters / what is missing, in plain words. */
  detail: string;
  done: boolean;
  href: string;
  action: string;
};

/** "What to do next" list on the dashboard: every gap on the public site, one click from its fix. */
export function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / Math.max(items.length, 1)) * 100);
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <section className="min-w-0 overflow-hidden rounded-[4px] border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Website checklist</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {done === items.length
              ? "Everything is filled in. Nice work — keep content fresh."
              : `${items.length - done} thing${items.length - done === 1 ? "" : "s"} left to make the portfolio complete. Each one links straight to where you fix it.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">{percent}%</span>
        </div>
      </div>
      <ul className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">
        {sorted.map((item) => (
          <li key={item.label} className="md:border-b md:border-border md:odd:border-r">
            <Link
              href={item.href}
              className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                  item.done ? "bg-white/[0.12] text-mist" : "bg-destructive/[0.1] text-destructive"
                )}
              >
                {item.done ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", item.done && "text-muted-foreground")}>{item.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
              </span>
              {!item.done && (
                <span className="mt-0.5 hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary sm:inline-flex">
                  {item.action} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

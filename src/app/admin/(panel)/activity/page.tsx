import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBox, buildHref } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param, searchRegex } from "@/lib/admin/paginate";
import { ActivityLog } from "@/lib/db/models";
import { toPlain } from "@/lib/db/serialize";
import { formatDateTime, relativeTime } from "@/lib/format";
import { maskIp } from "@/lib/security/request";
import { Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activity log" };

const TYPES = ["project", "post", "page", "service", "testimonial", "faq", "message", "media", "profile", "settings", "skill", "experience", "education", "account", "session", "visitor"] as const;

type LogRow = { id: string; actorEmail: string; action: string; entityType: string; summary: string; ip: string; createdAt: string };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const params = await searchParams;
  const type = param(params.type);
  const q = param(params.q);
  const page = pageFromParam(params.page);
  const filter = {
    ...(TYPES.includes(type as never) ? { entityType: type } : {}),
    ...(q ? { $or: [{ summary: searchRegex(q) }, { action: searchRegex(q) }, { actorEmail: searchRegex(q) }] } : {}),
  };
  const result = await paginate(ActivityLog, filter, { page, pageSize: 40, sort: { createdAt: -1 }, map: (doc) => toPlain<LogRow>(doc) });

  return (
    <>
      <PageHeader icon={Activity} title="Activity log" description="An audit trail of administrative actions (kept for one year)." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          items={[
            { label: "All", href: buildHref("/admin/activity", { q }), active: !type },
            ...TYPES.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), href: buildHref("/admin/activity", { type: value, q }), active: type === value })),
          ]}
        />
        <SearchBox action="/admin/activity" defaultValue={q} placeholder="Search activity…" hidden={{ type }} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState icon={Activity} title="No activity recorded" description="Actions such as publishing, editing and sign-ins appear here." />
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-[4px] border border-border bg-card">
          {result.items.map((log) => (
            <li key={log.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm">{log.summary || log.action}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {log.action} · {log.actorEmail || "system"}
                  {log.ip ? ` · ${maskIp(log.ip)}` : ""}
                </p>
              </div>
              <time dateTime={log.createdAt} title={formatDateTime(log.createdAt)} className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(log.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} href={(target) => buildHref("/admin/activity", { type, q, page: target })} />
    </>
  );
}

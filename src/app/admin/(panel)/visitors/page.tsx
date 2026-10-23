import { deleteVisitor } from "@/app/admin/_actions/visitors";
import { DataTable, type DataColumn, type DataRow } from "@/app/admin/_components/data-table";
import { FilterSelect } from "@/app/admin/_components/filter-select";
import { RangePicker } from "@/app/admin/_components/range-picker";
import { RowActions, type RowAction } from "@/app/admin/_components/row-actions";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBox, StatCard, buildHref } from "@/app/admin/_components/ui";
import {
  CHANNEL_LABELS,
  DeviceIcon,
  NotProvided,
  StatusChip,
  browserLabel,
  formatStamp,
  isOnline,
  locationLabel,
  plural,
  sourceLabel,
  statusOf,
  type VisitorRow,
} from "@/app/admin/_components/visitor-ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param } from "@/lib/admin/paginate";
import {
  VISITOR_SORTS,
  backfillVisitorFacts,
  purgeVisitorLog,
  resolveVisitorQuery,
  visitorChannelCounts,
  visitorStats,
} from "@/lib/admin/visitors";
import { STATUS_LABELS } from "@/lib/analytics/status";
import { DEVICE_TYPES, SOURCE_CHANNELS, VISITOR_STATUSES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/content/public";
import { Visitor } from "@/lib/db/models";
import { toPlain } from "@/lib/db/serialize";
import { formatDate, formatDuration, formatNumber, relativeTime } from "@/lib/format";
import { BadgeCheck, CalendarDays, Clock, Download, MailPlus, Radio, Repeat, Sparkles, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { after } from "next/server";

export const metadata: Metadata = { title: "Visitors" };

const PAGE_SIZE = 25;

// Everything the visitor log holds about one person, in the order the admin reads it.
const COLUMNS: DataColumn[] = [
  { key: "name", label: "Name", width: "minmax(9.5rem,1.2fr)" },
  { key: "status", label: "Status", width: "5.5rem", hideBelow: "sm" },
  { key: "vid", label: "Visitor ID", width: "6rem", hideBelow: "xl" },
  { key: "phone", label: "Phone", width: "7.5rem", hideBelow: "xl" },
  { key: "email", label: "Email", width: "minmax(11rem,1.3fr)", hideBelow: "xl" },
  { key: "location", label: "Location", width: "minmax(8rem,1fr)", hideBelow: "md" },
  { key: "device", label: "Device", width: "minmax(7.5rem,1fr)", hideBelow: "md" },
  { key: "browser", label: "Browser", width: "minmax(9.5rem,1.2fr)", hideBelow: "lg" },
  { key: "source", label: "Traffic source", width: "minmax(8rem,1fr)", hideBelow: "lg" },
  { key: "visits", label: "Visits", width: "4rem", align: "end", hideBelow: "sm" },
  { key: "first", label: "First visit", width: "6.5rem", hideBelow: "xl" },
  { key: "last", label: "Last visit", width: "7rem", align: "end" },
];

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const params = await searchParams;
  const query = resolveVisitorQuery({
    view: param(params.view),
    device: param(params.device),
    source: param(params.source),
    q: param(params.q),
    range: param(params.range),
    from: param(params.from),
    to: param(params.to),
    sort: param(params.sort),
  });
  const page = pageFromParam(params.page);

  const [settings, result, stats, channels] = await Promise.all([
    getSiteSettings(),
    paginate(Visitor, query.filter, {
      page,
      pageSize: PAGE_SIZE,
      sort: query.sort,
      map: (doc) => toPlain<VisitorRow>(doc),
    }),
    visitorStats(query.period, query.activeSince),
    visitorChannelCounts(query.period),
  ]);

  const retentionDays = Number(settings.analytics.visitorRetention);
  // Housekeeping after the page is sent: apply the retention policy and fill in
  // the traffic source and time totals for records saved before they existed.
  const host = (await headers()).get("host");
  after(async () => {
    try {
      await purgeVisitorLog(retentionDays);
      await backfillVisitorFacts(host);
    } catch (error) {
      console.error("[visitors] maintenance failed", error);
    }
  });

  // Carried by every control on the page, so filters combine instead of replacing each other.
  const rangeParams = query.range.preset === "custom" ? { from: query.range.from, to: query.range.to } : { range: query.range.preset };
  const base = {
    ...rangeParams,
    view: query.view === "all" ? undefined : query.view,
    device: query.device || undefined,
    source: query.source || undefined,
    sort: query.sortKey === "recent" ? undefined : query.sortKey,
    q: query.q || undefined,
  };
  const href = (changes: Record<string, string | number | undefined> = {}) => buildHref("/admin/visitors", { ...base, ...changes });

  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.visitors },
    { key: "online", label: "Online now", count: stats.active },
    ...VISITOR_STATUSES.map((status) => ({ key: status, label: STATUS_LABELS[status], count: stats[status] })),
  ];

  const rows: DataRow[] = result.items.map((visitor) => {
    const online = isOnline(visitor.lastSeenAt);
    const name = visitor.contact?.name?.trim();
    const email = visitor.contact?.email?.trim();
    const phone = visitor.contact?.phone?.trim();
    const location = locationLabel(visitor);
    const actions: RowAction[] = [
      { type: "link", label: "Open profile", icon: "show", href: `/admin/visitors/${visitor.id}` },
      { type: "separator" },
      {
        type: "action",
        label: "Delete",
        icon: "delete",
        destructive: true,
        action: deleteVisitor.bind(null, visitor.id),
        confirm: {
          title: "Delete this visitor?",
          description: `${name || visitor.deviceName || "This visitor"} (${visitor.ip || "no IP"}) and everything they did will be permanently deleted.`,
          confirmLabel: "Delete",
        },
      },
    ];

    return {
      id: visitor.id,
      label: name || visitor.deviceName || "visitor",
      cells: {
        name: (
          <Link href={`/admin/visitors/${visitor.id}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
            <span className="relative grid size-7 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
              <DeviceIcon type={visitor.deviceType} className="size-3.5" />
              {online && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-white ring-2 ring-card" />}
            </span>
            <span className="truncate text-sm font-medium">{name || <NotProvided />}</span>
          </Link>
        ),
        status: <StatusChip status={statusOf(visitor)} />,
        vid: (
          <span title={visitor.vid} className="block truncate font-mono text-[11px] text-muted-foreground">
            {visitor.vid.slice(0, 8)}
          </span>
        ),
        phone: phone ? (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="block truncate text-[13px] text-primary hover:underline">
            {phone}
          </a>
        ) : (
          <span className="block truncate text-[13px]">
            <NotProvided />
          </span>
        ),
        email: email ? (
          <a href={`mailto:${email}`} title={email} className="block truncate text-[13px] text-primary hover:underline">
            {email}
          </a>
        ) : (
          <span className="block truncate text-[13px]">
            <NotProvided />
          </span>
        ),
        location: (
          <span title={visitor.ip ? `IP ${visitor.ip}` : undefined} className="block truncate text-[13px] text-muted-foreground">
            {location || <NotProvided>Unknown</NotProvided>}
          </span>
        ),
        device: (
          <span title={`${visitor.deviceName}${visitor.inApp ? ` — opened in the ${visitor.inApp} app` : ""}`} className="block truncate text-[13px] text-muted-foreground">
            {visitor.deviceName || "Unknown"}
          </span>
        ),
        browser: (
          <span title={browserLabel(visitor)} className="block truncate text-[13px] text-muted-foreground">
            {browserLabel(visitor)}
          </span>
        ),
        source: (
          <span title={visitor.firstReferrer || undefined} className="block truncate text-[13px] text-muted-foreground">
            {sourceLabel(visitor)}
          </span>
        ),
        visits: (
          <span title={`${plural(visitor.pageviews, "page view")} · ${plural(visitor.actions, "action")}`} className="block text-[13px] font-medium tabular-nums">
            {formatNumber(Math.max(visitor.sessions, 1))}
          </span>
        ),
        first: (
          <span title={formatStamp(visitor.firstSeenAt)} className="block truncate text-[13px] text-muted-foreground">
            {formatDate(visitor.firstSeenAt)}
          </span>
        ),
        last: (
          <time dateTime={visitor.lastSeenAt} title={formatStamp(visitor.lastSeenAt)} className="block truncate text-[13px] text-muted-foreground">
            {online ? <span className="font-semibold text-mist dark:text-mist">Online</span> : relativeTime(visitor.lastSeenAt)}
          </time>
        ),
      },
      actions: <RowActions actions={actions} label={`Actions for ${name || visitor.deviceName || "visitor"}`} />,
    };
  });

  return (
    <>
      <PageHeader
        icon={UsersRound}
        title="Visitors"
        description={`Everyone who opened your site between ${query.range.from} and ${query.range.to}: device, browser, location and every page and click. Your own visits while signed in are skipped.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href={buildHref("/api/admin/visitors/export", base)} download>
              <Download /> Export CSV
            </a>
          </Button>
        }
      />

      {!settings.analytics.visitorLogEnabled && (
        <p role="alert" className="mb-6 rounded-[4px] border border-destructive/40 bg-destructive/[0.1] p-4 text-sm text-destructive dark:text-destructive">
          The visitor log is turned off, so new visitors are not being recorded.{" "}
          <Link href="/admin/settings" className="font-semibold underline underline-offset-2">
            Turn it on in Settings
          </Link>
          .
        </p>
      )}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <RangePicker
          basePath="/admin/visitors"
          preset={query.range.preset}
          from={query.range.from}
          to={query.range.to}
          extra={{ view: base.view, device: base.device, source: base.source, sort: base.sort, q: base.q }}
        />
        <p className="text-xs text-muted-foreground">
          Records are deleted after {retentionDays === 365 ? "12 months" : `${retentionDays} days`}.{" "}
          <Link href="/admin/settings" className="underline underline-offset-2 hover:text-foreground">
            Change
          </Link>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Unique visitors" value={formatNumber(stats.visitors)} hint="one per browser" icon={UsersRound} />
        <StatCard label="Visits" value={formatNumber(stats.sessions)} hint={plural(stats.pageviews, "page view")} icon={CalendarDays} />
        <StatCard label="Active now" value={formatNumber(stats.active)} hint="seen in the last 5 minutes" icon={Radio} href={href({ view: "online", page: undefined })} />
        <StatCard label="Time on site" value={formatDuration(stats.seconds)} hint="total, while the tab was open" icon={Clock} />
        <StatCard label="New" value={formatNumber(stats.new)} hint="first visit so far" icon={Sparkles} href={href({ view: "new", page: undefined })} />
        <StatCard label="Returning" value={formatNumber(stats.returning)} hint="came back later" icon={Repeat} href={href({ view: "returning", page: undefined })} />
        <StatCard label="Leads" value={formatNumber(stats.lead)} hint="sent the contact form" icon={MailPlus} href={href({ view: "lead", page: undefined })} />
        <StatCard label="Customers" value={formatNumber(stats.customer)} hint="marked by you" icon={BadgeCheck} href={href({ view: "customer", page: undefined })} />
      </div>

      <div className="mb-4">
        <FilterTabs
          items={tabs.map((tab) => ({
            label: tab.label,
            href: href({ view: tab.key === "all" ? undefined : tab.key, page: undefined }),
            active: query.view === tab.key,
            count: tab.count,
          }))}
        />
      </div>

      <DataTable
        label="Visitors"
        columns={COLUMNS}
        rows={rows}
        wide
        actionsWidth="2.5rem"
        toolbar={
          <>
            <SearchBox
              action="/admin/visitors"
              defaultValue={query.q}
              placeholder="Search name, phone, email, ID, IP, city…"
              hidden={{ ...base, q: undefined }}
            />
            <div className="grid grid-cols-2 gap-2 @3xl:flex @3xl:items-center">
              <FilterSelect
                name="device"
                label="Filter by device"
                value={query.device}
                basePath="/admin/visitors"
                params={base}
                className="@3xl:w-36"
                options={[
                  { value: "", label: "All devices" },
                  ...DEVICE_TYPES.map((type) => ({ value: type, label: type === "unknown" ? "Unknown device" : `${type[0].toUpperCase()}${type.slice(1)}` })),
                ]}
              />
              <FilterSelect
                name="source"
                label="Filter by traffic source"
                value={query.source}
                basePath="/admin/visitors"
                params={base}
                className="@3xl:w-40"
                options={[
                  { value: "", label: "All sources" },
                  ...SOURCE_CHANNELS.map((channel) => ({ value: channel, label: CHANNEL_LABELS[channel], count: channels[channel] ?? 0 })),
                ]}
              />
              <FilterSelect
                name="sort"
                label="Sort visitors"
                value={query.sortKey}
                basePath="/admin/visitors"
                params={base}
                className="col-span-2 @3xl:w-48"
                options={Object.entries(VISITOR_SORTS).map(([value, { label }]) => ({ value, label }))}
              />
            </div>
          </>
        }
        empty={
          <EmptyState
            icon={UsersRound}
            title={
              query.q
                ? "No visitors match your search"
                : query.filtered
                  ? "No visitors match these filters"
                  : "No visitors recorded in this period"
            }
            description={
              query.filtered
                ? "Try a wider date range or clear the filters."
                : "Open your site in a private window (signed out of the admin) and you will appear here within seconds."
            }
          />
        }
        footer={
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            href={(target) => href({ page: target })}
            className="mt-0"
          />
        }
      />
    </>
  );
}

import "server-only";

import type { SortOrder } from "mongoose";
import { dayEnd, dayStart, resolveRange } from "@/lib/analytics/days";
import { classifySource } from "@/lib/analytics/source";
import { STATUS_FILTERS } from "@/lib/analytics/status";
import {
  DEVICE_TYPES,
  ONLINE_WINDOW_MS,
  SOURCE_CHANNELS,
  VISITOR_STATUSES,
  type DeviceType,
  type SourceChannel,
  type VisitorStatus,
} from "@/lib/constants";
import { Visitor, VisitorEvent } from "@/lib/db/models";
import { searchRegex } from "./paginate";

/*
 * Everything the Visitors page and its CSV export need to turn a query string
 * into a database query. Kept in one place so the table, the stat tiles and
 * the export can never disagree about what a filter means.
 */

/** Fields the search box looks through. All of them hold strings. */
export const VISITOR_SEARCH_FIELDS = [
  "vid",
  "ip",
  "ips",
  "city",
  "region",
  "country",
  "browser",
  "os",
  "deviceName",
  "deviceModel",
  "deviceVendor",
  "inApp",
  "lastPath",
  "firstLanding",
  "firstReferrer",
  "language",
  "timezone",
  "source.name",
  "utm.source",
  "utm.campaign",
  "contact.name",
  "contact.email",
  "contact.phone",
  "contact.address",
] as const;

export const VISITOR_SORTS = {
  recent: { label: "Last visit (newest)", sort: { lastSeenAt: -1 } },
  oldest: { label: "Last visit (oldest)", sort: { lastSeenAt: 1 } },
  first: { label: "First visit (newest)", sort: { firstSeenAt: -1 } },
  earliest: { label: "First visit (oldest)", sort: { firstSeenAt: 1 } },
  visits: { label: "Most visits", sort: { sessions: -1, lastSeenAt: -1 } },
  pages: { label: "Most page views", sort: { pageviews: -1, lastSeenAt: -1 } },
  time: { label: "Longest on site", sort: { seconds: -1, lastSeenAt: -1 } },
} satisfies Record<string, { label: string; sort: Record<string, SortOrder> }>;
export type VisitorSortKey = keyof typeof VISITOR_SORTS;

/** Status tabs: the four statuses plus "online", which is about right now rather than history. */
export type VisitorView = VisitorStatus | "online" | "all";

export type VisitorQueryInput = {
  view?: string;
  device?: string;
  source?: string;
  q?: string;
  range?: string;
  from?: string;
  to?: string;
  sort?: string;
};

function oneOf<T extends string>(values: readonly T[], value: string | undefined): T | "" {
  return value && (values as readonly string[]).includes(value) ? (value as T) : "";
}

/**
 * Validate the query string and build the Mongo query from it. Anything
 * unrecognised falls back to the default, so a hand-edited URL can never
 * produce an error page or an unindexed scan.
 */
export function resolveVisitorQuery(input: VisitorQueryInput) {
  const range = resolveRange({ range: input.range, from: input.from, to: input.to });
  const status = oneOf(VISITOR_STATUSES, input.view);
  const view: VisitorView = status || (input.view === "online" ? "online" : "all");
  const device = oneOf(DEVICE_TYPES, input.device) as DeviceType | "";
  const source = oneOf(SOURCE_CHANNELS, input.source) as SourceChannel | "";
  const q = (input.q ?? "").trim().slice(0, 100);
  const sortKey = (input.sort && input.sort in VISITOR_SORTS ? input.sort : "recent") as VisitorSortKey;
  const activeSince = new Date(Date.now() - ONLINE_WINDOW_MS);

  // The period every number on the page is about: visitors seen within the chosen range.
  const period = { lastSeenAt: { $gte: dayStart(range.from), $lte: dayEnd(range.to) } };

  const clauses: Record<string, unknown>[] = [period];
  if (view === "online") clauses.push({ lastSeenAt: { $gte: activeSince } });
  if (status) clauses.push(STATUS_FILTERS[status]);
  if (device) clauses.push({ deviceType: device });
  if (source) clauses.push({ "source.channel": source });
  if (q) clauses.push({ $or: VISITOR_SEARCH_FIELDS.map((field) => ({ [field]: searchRegex(q) })) });

  return {
    range,
    view,
    status,
    device,
    source,
    q,
    sortKey,
    sort: VISITOR_SORTS[sortKey].sort as Record<string, SortOrder>,
    activeSince,
    /** Just the date range: what the stat tiles count. */
    period,
    /** The range plus every active filter: what the table and the export list. */
    filter: clauses.length === 1 ? clauses[0] : { $and: clauses },
    /** True when something other than the date range narrows the list. */
    filtered: clauses.length > 1,
  };
}

export type VisitorQuery = ReturnType<typeof resolveVisitorQuery>;

export type VisitorStats = {
  visitors: number;
  sessions: number;
  pageviews: number;
  actions: number;
  seconds: number;
  active: number;
} & Record<VisitorStatus, number>;

/**
 * Headline numbers for a period. The status counts reuse STATUS_FILTERS, the
 * same filters the tabs apply, so a tile and its tab always agree.
 */
export async function visitorStats(period: Record<string, unknown>, activeSince: Date): Promise<VisitorStats> {
  const [totals, statuses, active] = await Promise.all([
    Visitor.aggregate<{ visitors: number; sessions: number; pageviews: number; actions: number; seconds: number }>([
      { $match: period },
      {
        $group: {
          _id: null,
          visitors: { $sum: 1 },
          // A visitor recorded before their session counter ticked still came once.
          sessions: { $sum: { $max: ["$sessions", 1] } },
          pageviews: { $sum: "$pageviews" },
          actions: { $sum: "$actions" },
          seconds: { $sum: { $ifNull: ["$seconds", 0] } },
        },
      },
    ]),
    Promise.all(
      VISITOR_STATUSES.map(
        async (status) => [status, await Visitor.countDocuments({ $and: [period, STATUS_FILTERS[status]] })] as const
      )
    ),
    Visitor.countDocuments({ $and: [period, { lastSeenAt: { $gte: activeSince } }] }),
  ]);

  const sums = totals[0] ?? { visitors: 0, sessions: 0, pageviews: 0, actions: 0, seconds: 0 };
  return { ...sums, ...(Object.fromEntries(statuses) as Record<VisitorStatus, number>), active };
}

/** How many visitors arrived through each channel in the period, for the source filter. */
export async function visitorChannelCounts(period: Record<string, unknown>) {
  const rows = await Visitor.aggregate<{ _id: string | null; count: number }>([
    { $match: period },
    { $group: { _id: "$source.channel", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.filter((row) => row._id).map((row) => [row._id as SourceChannel, row.count])) as Partial<
    Record<SourceChannel, number>
  >;
}

/** Total engaged seconds per visitor, for one page of rows or one export batch. */
export async function engagedSeconds(vids: string[]) {
  if (!vids.length) return new Map<string, number>();
  const rows = await VisitorEvent.aggregate<{ _id: string; seconds: number }>([
    { $match: { vid: { $in: vids }, type: "pageview" } },
    { $group: { _id: "$vid", seconds: { $sum: "$duration" } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.seconds]));
}

/**
 * Enforce the retention the admin chose in Settings. The TTL indexes on both
 * collections are the hard one-year backstop; this applies a shorter policy,
 * and runs whenever the admin opens the Visitors page.
 */
export async function purgeVisitorLog(retentionDays: number) {
  // A missing or malformed setting must never reach Mongo as an invalid date.
  const days = Number.isFinite(retentionDays) ? Math.max(1, Math.min(365, Math.round(retentionDays))) : 365;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [visitors, events] = await Promise.all([
    Visitor.deleteMany({ lastSeenAt: { $lt: cutoff } }),
    VisitorEvent.deleteMany({ createdAt: { $lt: cutoff } }),
  ]);
  return { visitors: visitors.deletedCount ?? 0, events: events.deletedCount ?? 0, cutoff };
}

/**
 * Fill in the traffic source and time-on-site totals for visitors recorded
 * before those fields existed, a batch at a time, so filtering and sorting
 * work on the data the log already had.
 */
export async function backfillVisitorFacts(ownHost: string | null, limit = 200) {
  const stale = await Visitor.find({ $or: [{ "source.channel": { $exists: false } }, { seconds: { $exists: false } }] })
    .select("vid firstReferrer utm inApp")
    .limit(limit)
    .lean();
  if (!stale.length) return 0;

  const seconds = await engagedSeconds(stale.map((visitor) => visitor.vid));
  await Visitor.bulkWrite(
    stale.map((visitor) => ({
      updateOne: {
        filter: { _id: visitor._id },
        update: {
          $set: {
            source: classifySource({ referrer: visitor.firstReferrer, utm: visitor.utm ?? undefined, inApp: visitor.inApp, ownHost }),
            seconds: seconds.get(visitor.vid) ?? 0,
          },
        },
      },
    }))
  );
  return stale.length;
}

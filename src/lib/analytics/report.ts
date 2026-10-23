import type { AnalyticsMetric } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { AnalyticsDaily, Message } from "@/lib/db/models";
import { bucketKey, dayRange } from "./days";

export type SeriesPoint = { bucket: string; value: number };

export async function metricTotals(metrics: AnalyticsMetric[], from: string, to: string) {
  await connectDB();
  const rows = await AnalyticsDaily.aggregate<{ _id: string; total: number }>([
    { $match: { metric: { $in: metrics }, day: { $gte: from, $lte: to } } },
    { $group: { _id: "$metric", total: { $sum: "$count" } } },
  ]);
  const totals = Object.fromEntries(metrics.map((metric) => [metric, 0])) as Record<AnalyticsMetric, number>;
  for (const row of rows) totals[row._id as AnalyticsMetric] = row.total;
  return totals;
}

export async function metricSeries(
  metrics: AnalyticsMetric[],
  from: string,
  to: string,
  granularity: "day" | "week" | "month" = "day"
) {
  await connectDB();
  const rows = await AnalyticsDaily.aggregate<{ _id: { day: string; metric: string }; total: number }>([
    { $match: { metric: { $in: metrics }, day: { $gte: from, $lte: to } } },
    { $group: { _id: { day: "$day", metric: "$metric" }, total: { $sum: "$count" } } },
  ]);

  const buckets = new Map<string, Record<string, number>>();
  for (const day of dayRange(from, to)) {
    const key = bucketKey(day, granularity);
    if (!buckets.has(key)) buckets.set(key, Object.fromEntries(metrics.map((metric) => [metric, 0])));
  }
  for (const row of rows) {
    const bucket = buckets.get(bucketKey(row._id.day, granularity));
    if (bucket) bucket[row._id.metric] = (bucket[row._id.metric] ?? 0) + row.total;
  }
  return [...buckets.entries()].map(([bucket, values]) => ({ bucket, ...values }));
}

export async function topKeys(metric: AnalyticsMetric, from: string, to: string, limit = 10) {
  await connectDB();
  const rows = await AnalyticsDaily.aggregate<{ _id: string; total: number }>([
    { $match: { metric, day: { $gte: from, $lte: to } } },
    { $group: { _id: "$key", total: { $sum: "$count" } } },
    { $sort: { total: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((row) => ({ key: row._id, value: row.total }));
}

/** Contact submissions come from the messages collection itself (excluding spam). */
export async function contactSubmissions(from: string, to: string) {
  await connectDB();
  return Message.countDocuments({
    status: { $ne: "spam" },
    createdAt: { $gte: new Date(`${from}T00:00:00.000Z`), $lte: new Date(`${to}T23:59:59.999Z`) },
  });
}

export async function hasAnyAnalytics() {
  await connectDB();
  return Boolean(await AnalyticsDaily.exists({}));
}

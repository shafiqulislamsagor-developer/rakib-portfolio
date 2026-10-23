import "server-only";

import { dayRange, previousRange, resolveRange } from "@/lib/analytics/days";
import { contactSubmissions, metricSeries, metricTotals, topKeys } from "@/lib/analytics/report";
import { Post, Project } from "@/lib/db/models";

/*
 * Analytics report assembled from the first-party aggregates. Every number
 * here is calculated by the application from data it stores itself:
 *   - pageview / visitor / referrer / country: /api/track beacons
 *   - project_view / post_view: the same beacons on detail pages
 *   - cv_download: the /cv redirect route
 *   - contact submissions: the messages collection (spam excluded)
 * Nothing is estimated or filled in; empty ranges report zero.
 */

export type Granularity = "day" | "week" | "month";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function percentChange(current: number, previous: number) {
  // No comparison is meaningful when the previous period has no data.
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function buildReport(params: { range?: string; from?: string; to?: string; granularity?: string }, limit = 8) {
  const range = resolveRange(params);
  const previous = previousRange(range.from, range.to);
  const granularity: Granularity =
    params.granularity === "week" || params.granularity === "month"
      ? params.granularity
      : range.days > 120
        ? "week"
        : "day";

  const metrics = ["pageview", "visitor", "project_view", "post_view", "cv_download"] as const;
  const [totals, previousTotals, series, pages, projectRows, postRows, referrers, countries, contacts, previousContacts] =
    await Promise.all([
      metricTotals([...metrics], range.from, range.to),
      metricTotals([...metrics], previous.from, previous.to),
      metricSeries(["pageview", "visitor"], range.from, range.to, granularity),
      topKeys("pageview", range.from, range.to, limit),
      topKeys("project_view", range.from, range.to, limit),
      topKeys("post_view", range.from, range.to, limit),
      topKeys("referrer", range.from, range.to, limit),
      topKeys("country", range.from, range.to, limit),
      contactSubmissions(range.from, range.to),
      contactSubmissions(previous.from, previous.to),
    ]);

  const [projectTitles, postTitles] = await Promise.all([
    Project.find({ slug: { $in: projectRows.map((row) => row.key) } }).select("slug title").lean(),
    Post.find({ slug: { $in: postRows.map((row) => row.key) } }).select("slug title").lean(),
  ]);
  const titleFor = (rows: { slug: string; title: string }[], slug: string) => rows.find((row) => row.slug === slug)?.title ?? slug;

  return {
    range,
    previous,
    granularity,
    dayCount: dayRange(range.from, range.to).length,
    totals: { ...totals, contacts },
    previousTotals: { ...previousTotals, contacts: previousContacts },
    conversionRate: totals.visitor > 0 ? (contacts / totals.visitor) * 100 : null,
    series: series as { bucket: string; pageview: number; visitor: number }[],
    pages: pages.map((row) => ({ label: row.key, value: row.value, href: row.key })),
    projects: projectRows.map((row) => ({ label: titleFor(projectTitles, row.key), value: row.value, href: `/projects/${row.key}` })),
    posts: postRows.map((row) => ({ label: titleFor(postTitles, row.key), value: row.value, href: `/blog/${row.key}` })),
    referrers: referrers.map((row) => ({ label: row.key === "(direct)" ? "Direct / none" : row.key, value: row.value })),
    countries: countries.map((row) => ({ label: countryName(row.key), value: row.value })),
  };
}

export type AnalyticsReport = Awaited<ReturnType<typeof buildReport>>;

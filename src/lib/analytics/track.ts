import type { AnalyticsMetric } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { AnalyticsDaily, Post, Project, VisitorMark } from "@/lib/db/models";
import { visiblePostFilter } from "@/lib/content/public";
import { hmac } from "@/lib/security/crypto";
import { dayKey } from "./days";

/*
 * First-party, cookie-less analytics. Only daily aggregate counters are
 * stored. Unique visitors are counted with a salted hash of (day, IP,
 * user-agent) that rotates every day and expires after 48 hours, so visitors
 * cannot be tracked across days and no raw IP addresses are kept.
 */

export async function incrementMetric(metric: AnalyticsMetric, key = "", amount = 1, day = dayKey()) {
  await connectDB();
  await AnalyticsDaily.updateOne(
    { day, metric, key: key.slice(0, 200) },
    { $inc: { count: amount } },
    { upsert: true }
  ).catch(async (error: { code?: number }) => {
    if (error.code !== 11000) throw error;
    await AnalyticsDaily.updateOne({ day, metric, key: key.slice(0, 200) }, { $inc: { count: amount } });
  });
}

const PAGE_PATTERNS = [
  { pattern: /^\/$/, kind: "page" as const },
  { pattern: /^\/projects$/, kind: "page" as const },
  { pattern: /^\/blog$/, kind: "page" as const },
  { pattern: /^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/, kind: "project" as const },
  { pattern: /^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)$/, kind: "post" as const },
];

/** Only known public routes are counted, so junk paths cannot bloat the collection. */
export async function classifyPath(path: string) {
  for (const { pattern, kind } of PAGE_PATTERNS) {
    const match = pattern.exec(path);
    if (!match) continue;
    if (kind === "page") return { kind, path };
    await connectDB();
    const slug = match[1];
    const exists =
      kind === "project"
        ? await Project.exists({ slug, status: "published" })
        : await Post.exists({ slug, ...visiblePostFilter() });
    return exists ? { kind, path, slug } : null;
  }
  return null;
}

export function normalizeReferrer(referrer: string, ownHost: string | null) {
  if (!referrer) return "(direct)";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0])) return null;
    return host.slice(0, 120);
  } catch {
    return "(direct)";
  }
}

export async function recordPageView(input: {
  path: string;
  referrer: string;
  landing: boolean;
  ip: string;
  userAgent: string;
  country: string;
  ownHost: string | null;
}) {
  const target = await classifyPath(input.path);
  if (!target) return { recorded: false as const };

  const day = dayKey();
  const writes: Promise<unknown>[] = [incrementMetric("pageview", target.path, 1, day)];

  if (target.kind === "project" && target.slug) {
    writes.push(incrementMetric("project_view", target.slug, 1, day));
    writes.push(Project.updateOne({ slug: target.slug }, { $inc: { viewCount: 1 } }));
  }
  if (target.kind === "post" && target.slug) {
    writes.push(incrementMetric("post_view", target.slug, 1, day));
    writes.push(Post.updateOne({ slug: target.slug }, { $inc: { viewCount: 1 } }));
  }

  if (input.landing) {
    const source = normalizeReferrer(input.referrer, input.ownHost);
    if (source) writes.push(incrementMetric("referrer", source, 1, day));
  }

  const hash = hmac(`${day}|${input.ip}|${input.userAgent}`);
  const isNewVisitor = await VisitorMark.create({ day, hash })
    .then(() => true)
    .catch((error: { code?: number }) => {
      if (error.code === 11000) return false;
      throw error;
    });
  if (isNewVisitor) {
    writes.push(incrementMetric("visitor", "", 1, day));
    if (input.country) writes.push(incrementMetric("country", input.country, 1, day));
  }

  await Promise.all(writes);
  return { recorded: true as const, kind: target.kind };
}

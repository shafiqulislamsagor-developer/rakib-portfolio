import { countryName } from "@/lib/admin/analytics";
import { csvResponse } from "@/lib/admin/csv";
import { resolveRange } from "@/lib/analytics/days";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { AnalyticsDaily } from "@/lib/db/models";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Raw daily aggregates for a date range as CSV (day, metric, key, count). */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const range = resolveRange({ from: params.get("from") ?? undefined, to: params.get("to") ?? undefined, range: params.get("range") ?? undefined });
  await connectDB();
  const rows = await AnalyticsDaily.find({ day: { $gte: range.from, $lte: range.to } })
    .sort({ day: 1, metric: 1, count: -1 })
    .limit(100_000)
    .lean();

  return csvResponse(
    `analytics-${range.from}-to-${range.to}.csv`,
    ["day", "metric", "key", "label", "count"],
    rows.map((row) => [row.day, row.metric, row.key, row.metric === "country" ? countryName(row.key) : row.key, row.count])
  );
}

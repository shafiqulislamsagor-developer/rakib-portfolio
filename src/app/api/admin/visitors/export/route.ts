import { csvResponse } from "@/lib/admin/csv";
import { engagedSeconds, resolveVisitorQuery } from "@/lib/admin/visitors";
import { countryName } from "@/lib/admin/analytics";
import { classifySource } from "@/lib/analytics/source";
import { visitorStatus } from "@/lib/analytics/status";
import { logActivity } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { Visitor } from "@/lib/db/models";
import { getClientIp } from "@/lib/security/request";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Enough for a portfolio's whole log; keeps one request from loading an unbounded set. */
const MAX_ROWS = 10_000;

const HEADERS = [
  // The columns the Visitors table shows, in the same order.
  "visitor_id",
  "name",
  "phone",
  "email",
  "address",
  "status",
  "location",
  "device",
  "browser",
  "first_visit",
  "last_visit",
  "visits",
  "traffic_source",
  // Everything else the log holds about them.
  "traffic_channel",
  "device_type",
  "device_vendor",
  "device_model",
  "in_app_browser",
  "os",
  "ip",
  "earlier_ips",
  "country_code",
  "city",
  "region",
  "latitude",
  "longitude",
  "language",
  "timezone",
  "screen",
  "page_views",
  "actions",
  "seconds_on_site",
  "first_referrer",
  "landing_page",
  "last_page",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "contact_message_id",
  "contacted_at",
  "asked_to_be_contacted_at",
] as const;

/**
 * The visitor log as CSV, honouring the filters on the Visitors page. Admin
 * only, never cached, and recorded in the activity log because the file holds
 * personal data once a visitor has sent the contact form.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const query = resolveVisitorQuery({
    view: params.get("view") ?? undefined,
    device: params.get("device") ?? undefined,
    source: params.get("source") ?? undefined,
    q: params.get("q") ?? undefined,
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });

  await connectDB();
  const visitors = await Visitor.find(query.filter).sort(query.sort).limit(MAX_ROWS).lean();
  const seconds = await engagedSeconds(visitors.map((visitor) => visitor.vid));
  const stamp = (value: Date | null | undefined) => (value ? new Date(value).toISOString() : "");

  const rows = visitors.map((visitor) => {
    const contact = visitor.contact;
    const source = visitor.source?.channel
      ? { channel: visitor.source.channel, name: visitor.source.name ?? "" }
      : classifySource({ referrer: visitor.firstReferrer, utm: visitor.utm ?? undefined, inApp: visitor.inApp });
    return [
      visitor.vid,
      contact?.name || "Not provided",
      contact?.phone || "Not provided",
      contact?.email || "Not provided",
      contact?.address || "Not provided",
      visitorStatus({
        customer: visitor.customer,
        sessions: visitor.sessions,
        contact: visitor.contact,
        reachedOutAt: visitor.reachedOutAt,
      }),
      [visitor.city, visitor.country ? countryName(visitor.country) : ""].filter(Boolean).join(", "),
      visitor.deviceName,
      [visitor.browser, visitor.browserVersion].filter(Boolean).join(" "),
      stamp(visitor.firstSeenAt),
      stamp(visitor.lastSeenAt),
      Math.max(visitor.sessions, 1),
      source.name || source.channel,
      source.channel,
      visitor.deviceType,
      visitor.deviceVendor,
      visitor.deviceModel,
      visitor.inApp,
      [visitor.os, visitor.osVersion].filter(Boolean).join(" "),
      visitor.ip,
      (visitor.ips ?? []).filter((ip) => ip !== visitor.ip).join(" "),
      visitor.country,
      visitor.city,
      visitor.region,
      visitor.latitude,
      visitor.longitude,
      visitor.languages || visitor.language,
      visitor.timezone,
      visitor.screen,
      visitor.pageviews,
      visitor.actions,
      visitor.seconds ?? seconds.get(visitor.vid) ?? 0,
      visitor.firstReferrer,
      visitor.firstLanding,
      visitor.lastPath,
      visitor.utm?.source ?? "",
      visitor.utm?.medium ?? "",
      visitor.utm?.campaign ?? "",
      contact?.messageId ? String(contact.messageId) : "",
      stamp(contact?.at),
      stamp(visitor.reachedOutAt),
    ];
  });

  await logActivity(
    { id: session.user.id, email: session.user.email },
    "visitor.export",
    {
      entityType: "visitor",
      summary: `Exported ${rows.length} visitor records (${query.range.from} to ${query.range.to}${query.filtered ? ", filtered" : ""})`,
      ip: getClientIp(request.headers),
    }
  );

  return csvResponse(`visitors-${query.range.from}-to-${query.range.to}.csv`, HEADERS, rows);
}

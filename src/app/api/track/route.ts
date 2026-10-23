import { recordPageView } from "@/lib/analytics/track";
import { recordVisitorEvent } from "@/lib/analytics/visitors";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getSiteSettings } from "@/lib/content/public";
import { isDbConfigured } from "@/lib/env";
import { hmac } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp, getCountry, getGeo, getUserAgent, isLikelyBot } from "@/lib/security/request";
import { trackPayloadSchema } from "@/lib/validation/tracking";
import { TRACKING_RATE_LIMITS } from "@/lib/security/rate-limit-config";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Generous for a real visitor (every click is an event), tight enough to stop log flooding.
const EVENTS_PER_IP = TRACKING_RATE_LIMITS;

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return noContent();

  // Ignore cross-site beacons, crawlers, and visitors who opted out of tracking.
  if (request.headers.get("sec-fetch-site") === "cross-site") return noContent();
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return noContent();
  const userAgent = getUserAgent(request.headers);
  if (isLikelyBot(userAgent)) return noContent();

  const body = await request.text();
  if (body.length > 4000) return noContent();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return noContent();
  }
  const parsed = trackPayloadSchema.safeParse(json);
  if (!parsed.success) return noContent();
  const event = { ...parsed.data, path: parsed.data.path.split("?")[0].replace(/\/+$/, "") || "/" };
  const ip = getClientIp(request.headers);

  try {
    const { analytics } = await getSiteSettings();
    const tasks: Promise<unknown>[] = [];

    if (analytics.firstPartyEnabled && event.type === "pageview") {
      tasks.push(
        recordPageView({
          path: event.path,
          referrer: event.referrer,
          landing: event.landing,
          ip,
          userAgent,
          country: getCountry(request.headers),
          ownHost: request.headers.get("host"),
        })
      );
    }

    // The signed-in admin browsing their own site is left out of the visitor log.
    if (analytics.visitorLogEnabled && !request.cookies.has(SESSION_COOKIE)) {
      tasks.push(
        rateLimit(`track:${hmac(ip)}`, EVENTS_PER_IP.limit, EVENTS_PER_IP.windowMs).then((limit) =>
          limit.allowed
            ? recordVisitorEvent(event, { ip, userAgent, geo: getGeo(request.headers), ownHost: request.headers.get("host") })
            : null
        )
      );
    }

    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === "rejected") console.error("[track] failed to record event", result.reason);
    }
  } catch (error) {
    console.error("[track] failed to record event", error);
  }
  return noContent();
}

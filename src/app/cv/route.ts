import { incrementMetric } from "@/lib/analytics/track";
import { getProfile } from "@/lib/content/public";
import { isDbConfigured } from "@/lib/env";
import { isLikelyBot } from "@/lib/security/request";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Counts CV downloads (first-party, aggregate only) and redirects to the current CV file. */
export async function GET(request: NextRequest) {
  const profile = await getProfile();
  if (!profile.cv.url) {
    return NextResponse.json({ error: "No CV is available right now." }, { status: 404 });
  }

  if (isDbConfigured() && !isLikelyBot(request.headers.get("user-agent") ?? "")) {
    await incrementMetric("cv_download").catch((error) => console.error("[cv] tracking failed", error));
  }

  const target = new URL(profile.cv.url, request.nextUrl.origin);
  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

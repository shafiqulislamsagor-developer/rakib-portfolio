import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/*
 * Optimistic edge check only: requests without a session cookie are turned
 * away early. The cookie is fully validated against the database on the
 * server (requireAdmin / getSession) for every admin page, action and API.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!hasSessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return privateResponse(NextResponse.next());
  }

  if (pathname === "/admin/login") {
    return privateResponse(NextResponse.next());
  }

  if (!hasSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return privateResponse(NextResponse.redirect(loginUrl));
  }

  return privateResponse(NextResponse.next());
}

function privateResponse(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

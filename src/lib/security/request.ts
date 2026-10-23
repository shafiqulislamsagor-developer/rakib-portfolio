type HeaderSource = Pick<Headers, "get">;

/** Best-effort client IP. Vercel sets these headers and overwrites client-supplied values. */
export function getClientIp(headers: HeaderSource) {
  const candidates = [
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for"),
  ];
  for (const value of candidates) {
    const ip = value?.split(",")[0]?.trim();
    if (ip) return ip.slice(0, 64);
  }
  return "unknown";
}

export function getCountry(headers: HeaderSource) {
  const country = headers.get("x-vercel-ip-country")?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(country) ? country : "";
}

/** City-level location from Vercel's edge headers (empty when not deployed on Vercel). */
export function getGeo(headers: HeaderSource) {
  const read = (name: string) => {
    const value = headers.get(name)?.trim() ?? "";
    try {
      return decodeURIComponent(value).slice(0, 80);
    } catch {
      return value.slice(0, 80);
    }
  };
  const coordinate = (name: string) => (/^-?\d{1,3}(\.\d+)?$/.test(read(name)) ? read(name) : "");
  return {
    country: getCountry(headers),
    region: read("x-vercel-ip-country-region"),
    city: read("x-vercel-ip-city"),
    latitude: coordinate("x-vercel-ip-latitude"),
    longitude: coordinate("x-vercel-ip-longitude"),
  };
}

export function getUserAgent(headers: HeaderSource) {
  return (headers.get("user-agent") ?? "").slice(0, 400);
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch|go-http-client|httpclient/i;

export function isLikelyBot(userAgent: string) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/**
 * CSRF defence for route handlers that change state: the browser-supplied
 * Origin must match the host serving the request. (Server Actions get the
 * same check from Next.js automatically.)
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Mask the last part of an IP for display (e.g. 203.0.113.x). */
export function maskIp(ip: string) {
  if (!ip || ip === "unknown") return "unknown";
  if (ip.includes(".")) return ip.split(".").slice(0, 3).join(".") + ".x";
  return ip.split(":").slice(0, 3).join(":") + ":…";
}

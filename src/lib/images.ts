/**
 * next/image optimizes same-site files (public/ and uploads served from
 * /media). External URLs are rendered unoptimized instead of failing.
 */
export function shouldOptimize(url: string) {
  return Boolean(url) && url.startsWith("/") && !url.startsWith("//") && !url.endsWith(".svg");
}

export function absoluteUrl(url: string, base: string) {
  if (!url) return "";
  try {
    return new URL(url, base).toString();
  } catch {
    return "";
  }
}

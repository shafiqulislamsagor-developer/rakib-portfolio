import { cache } from "react";
import { getSiteSettings } from "@/lib/content/public";
import { platformSiteUrl } from "@/lib/env";

/**
 * The canonical public URL of the site (no trailing slash). It is set in
 * Admin → Settings; NEXT_PUBLIC_SITE_URL and the Vercel production domain are
 * only fallbacks for the very first deploy, before anything has been saved.
 */
const FALLBACK_SITE_URL = "http://localhost:3000";

export function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Used before the database can be read (and by the admin as the fallback hint). */
export function fallbackSiteUrl() {
  return normalizeSiteUrl(platformSiteUrl()) || FALLBACK_SITE_URL;
}

export const getSiteUrl = cache(async () => {
  try {
    const settings = await getSiteSettings();
    return normalizeSiteUrl(settings.siteUrl) || fallbackSiteUrl();
  } catch {
    return fallbackSiteUrl();
  }
});

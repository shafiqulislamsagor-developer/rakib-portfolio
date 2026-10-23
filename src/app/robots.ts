import { getSiteSettings } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export const revalidate = 600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [settings, siteUrl] = await Promise.all([getSiteSettings(), getSiteUrl()]);
  return {
    rules: settings.seo.allowIndexing
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cv"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

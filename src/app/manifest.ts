import { getProfile, getSiteSettings } from "@/lib/content/public";
import { brandHexColors } from "@/lib/theme";
import type { MetadataRoute } from "next";

export const revalidate = 600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [settings, profile] = await Promise.all([getSiteSettings(), getProfile()]);
  const brand = brandHexColors(settings.theme.preset);
  return {
    name: `${settings.siteName} — Developer Portfolio`,
    short_name: `${profile.shortName || settings.siteName} Portfolio`,
    description: settings.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: brand.deep,
    theme_color: brand.primary,
    icons: [
      {
        src: settings.faviconUrl || "/icon.svg",
        sizes: "any",
        type: settings.faviconUrl ? undefined : "image/svg+xml",
      },
    ],
  };
}

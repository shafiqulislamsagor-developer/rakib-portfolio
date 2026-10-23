import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { defaultSettings } from "@/data/defaults";
import { getSiteSettings } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

// Segoe UI is the design font. It ships with Windows and is used from the
// system there; Selawik is Microsoft's metric-compatible open-source
// fallback for other platforms.
const selawik = localFont({
  src: [
    { path: "../fonts/selawik/selawk.woff2", weight: "400", style: "normal" },
    { path: "../fonts/selawik/selawksb.woff2", weight: "600", style: "normal" },
    { path: "../fonts/selawik/selawkb.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-selawik",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-google",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-sora-google",
  display: "swap",
});

/*
 * Runs before first paint. On the public pages it scales the 1440px design
 * canvas down on narrower screens; the admin panel is a responsive tool, so it
 * is left at its natural size. Animations are turned on unless the visitor
 * prefers reduced motion.
 */
const bootScript = `(function(){var d=document.documentElement;if(location.pathname.indexOf("/admin")!==0){function f(){d.style.zoom="1";var w=d.clientWidth;d.style.zoom=String(Math.min(1,w/1440))}f();addEventListener("resize",f)}try{if(matchMedia("(prefers-reduced-motion: no-preference)").matches)d.classList.add("motion")}catch(e){}})();`;

/** Never let a settings lookup failure take down every page (including the admin login). */
async function loadSettings() {
  try {
    return await getSiteSettings();
  } catch (error) {
    console.error("[layout] falling back to default settings", error);
    return defaultSettings;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSettings();
  const siteUrl = await getSiteUrl();
  const { seo } = settings;
  const ogImage = seo.ogImage || "/opengraph-image";

  return {
    title: {
      default: seo.titleDefault || settings.siteName,
      template: seo.titleTemplate || `%s — ${settings.siteName}`,
    },
    description: seo.description || settings.siteDescription,
    keywords: seo.keywords,
    authors: [{ name: settings.siteName, url: siteUrl }],
    creator: settings.siteName,
    publisher: settings.siteName,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      url: siteUrl,
      title: seo.titleDefault || settings.siteName,
      description: seo.description || settings.siteDescription,
      siteName: settings.siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${settings.siteName} portfolio` }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.titleDefault || settings.siteName,
      description: seo.description || settings.siteDescription,
      images: [seo.ogImage || "/twitter-image"],
      ...(seo.twitterHandle ? { creator: seo.twitterHandle.startsWith("@") ? seo.twitterHandle : `@${seo.twitterHandle}` } : {}),
    },
    category: "portfolio",
    robots: seo.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    ...(seo.googleSiteVerification ? { verification: { google: seo.googleSiteVerification } } : {}),
    ...(settings.faviconUrl ? { icons: { icon: settings.faviconUrl, shortcut: settings.faviconUrl, apple: settings.faviconUrl } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#020202",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `dark` is permanent: the design has one palette, and it keeps the `dark:`
    // utilities in the admin panel resolving against it.
    <html
      lang="en"
      className={`dark ${selawik.variable} ${inter.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}

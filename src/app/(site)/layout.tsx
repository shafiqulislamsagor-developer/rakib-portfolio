import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { Reveals } from "@/components/motion/Reveals";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { getProfile, getSiteSettings } from "@/lib/content/public";
import { jsonLd } from "@/lib/format";
import { absoluteUrl } from "@/lib/images";
import { getSiteUrl } from "@/lib/site";
import VisitorTracker from "./visitor-tracker";
import VoiceIntro from "./voice-intro";

/*
 * Chrome shared by every public page: Lenis smooth scrolling, the scroll
 * reveal engine, the structured-data Person record and the analytics the
 * admin panel switches on. The navigation and footer are part of each page's
 * own composition, because their geometry differs per page in the design.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, profile, siteUrl] = await Promise.all([getSiteSettings(), getProfile(), getSiteUrl()]);
  const gaId = settings.analytics.gaMeasurementId;

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: siteUrl,
    jobTitle: profile.title,
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    ...(profile.avatar.url ? { image: absoluteUrl(profile.avatar.url, siteUrl) } : {}),
    ...(profile.location ? { address: { "@type": "PostalAddress", addressLocality: profile.location } } : {}),
    sameAs: profile.socials.map((social) => social.url),
    knowsAbout: profile.heroCode.craft,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(person) }} />
      <SmoothScroll>
        {children}
        <Reveals />
      </SmoothScroll>
      <SpeedInsights />
      <Analytics />
      {(settings.analytics.firstPartyEnabled || settings.analytics.visitorLogEnabled) && <VisitorTracker />}
      {settings.voiceIntro.enabled && settings.voiceIntro.url && (
        <VoiceIntro
          url={settings.voiceIntro.url}
          label={settings.voiceIntro.label}
          transcript={settings.voiceIntro.transcript}
          autoplay={settings.voiceIntro.autoplay}
          oncePerSession={settings.voiceIntro.oncePerSession}
        />
      )}
      {gaId && /^G-[A-Z0-9]+$/.test(gaId) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}

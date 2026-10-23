import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { getChrome } from "@/lib/chrome";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getFaqs, getProfile, getSiteSettings } from "@/lib/content/public";
import { jsonLd } from "@/lib/format";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("contact", "/contact", "Contact");
}

export default async function ContactPage() {
  const [chrome, settings, profile, faqs] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getFaqs("contact"),
  ]);
  const copy = settings.sectionCopy.contact;

  const faqData = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <div className="relative overflow-x-clip">
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqData) }} />}
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <PageHero
          eyebrow={copy.eyebrow || "Contact"}
          heading={copy.heading || settings.pages.contact.title || "LET'S WORK TOGETHER"}
          intro={copy.intro}
        >
          {/* The ways to reach me, as a hairline row under the heading. */}
          <dl className="mt-14 flex flex-wrap gap-x-20 gap-y-8">
            <div className="flex flex-col gap-2">
              <dt className="text-[12px] tracking-[0.9px] text-g3 uppercase">Email</dt>
              <dd>
                <a href={`mailto:${profile.email}`} className="text-[20px] text-g4 transition-colors hover:text-white">
                  {profile.email}
                </a>
              </dd>
            </div>
            {profile.phone && (
              <div className="flex flex-col gap-2">
                <dt className="text-[12px] tracking-[0.9px] text-g3 uppercase">Phone</dt>
                <dd>
                  <a
                    href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}
                    className="text-[20px] text-g4 transition-colors hover:text-white"
                  >
                    {profile.phone}
                  </a>
                </dd>
              </div>
            )}
            {profile.location && (
              <div className="flex flex-col gap-2">
                <dt className="text-[12px] tracking-[0.9px] text-g3 uppercase">Based in</dt>
                <dd className="text-[20px] text-g4">{profile.location}</dd>
              </div>
            )}
            {profile.availability && (
              <div className="flex flex-col gap-2">
                <dt className="text-[12px] tracking-[0.9px] text-g3 uppercase">Availability</dt>
                <dd className="text-[20px] text-g4">{profile.availability}</dd>
              </div>
            )}
          </dl>
        </PageHero>

        <div className="mt-20">
          <Contact
            eyebrow={copy.eyebrow}
            heading={copy.heading}
            intro={copy.intro}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        </div>

        {faqs.length > 0 && (
          <section aria-labelledby="contact-faq" className="mx-auto mt-[136px] w-full max-w-[1440px] px-10">
            <p data-reveal="fade" className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">
              {`/     ${settings.sectionCopy.faq.eyebrow || "FAQ"}`}
            </p>
            <h2 id="contact-faq" data-reveal="lines" className="mt-2 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
              {settings.sectionCopy.faq.heading || "Before you write"}
            </h2>
            <dl className="mt-12 flex flex-col">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  data-reveal="up"
                  data-reveal-delay={String(index * 0.06)}
                  className="flex gap-20 border-t border-[#4e4e4e]/50 py-10 last:border-b"
                >
                  <dt className="w-[560px] shrink-0 text-[28px] leading-[34px] tracking-[-0.5px] text-g1">{faq.question}</dt>
                  <dd className="text-[18px] leading-[28px] text-g2">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}

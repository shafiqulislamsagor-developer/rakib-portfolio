import type { Metadata } from "next";
import Image from "next/image";
import { ContentIcon } from "@/components/content-icon";
import { OutlineButton } from "@/components/kit";
import { Markdown } from "@/components/markdown";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { Process } from "@/components/home/Process";
import { getChrome } from "@/lib/chrome";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getFaqs, getProfile, getServices, getSiteSettings } from "@/lib/content/public";
import { processSteps } from "@/lib/design";
import { jsonLd } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("services", "/services", "Services");
}

export default async function ServicesPage() {
  const [chrome, settings, profile, services, faqs, siteUrl] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getServices(),
    getFaqs("services"),
    getSiteUrl(),
  ]);
  const copy = settings.sectionCopy.services;

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${profile.name} — ${profile.title}`,
    url: `${siteUrl}/services`,
    ...(profile.location
      ? { areaServed: "Worldwide", address: { "@type": "PostalAddress", addressLocality: profile.location } }
      : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.title, description: service.summary },
        // Prices are free text (currency, "From …"), so they are published as a
        // human-readable specification rather than a machine-readable amount.
        ...(service.price.amount
          ? {
              priceSpecification: {
                "@type": "PriceSpecification",
                description: [service.price.amount, service.price.unit].filter(Boolean).join(" "),
              },
            }
          : {}),
      })),
    },
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(serviceData) }} />
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqData) }} />}
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <PageHero
          eyebrow={copy.eyebrow || "Services"}
          heading={copy.heading || settings.pages.services.title || "What I can build for you"}
          intro={copy.intro || profile.intro}
        />

        {/* One hairline-framed card per service, two to a row on the 1360px canvas. */}
        <section aria-label="Services" className="mx-auto mt-20 w-full max-w-[1440px] px-10">
          <ul className="grid grid-cols-2 gap-5">
            {services.map((service, index) => (
              <li
                key={service.id}
                data-reveal="up"
                data-reveal-delay={String((index % 2) * 0.1)}
                className={`relative flex flex-col gap-7 overflow-hidden rounded-[4px] border p-10 ${
                  service.popular ? "border-white/40 bg-white/[0.04]" : "border-[#4e4e4e]/50"
                }`}
              >
                {service.popular && (
                  <span className="absolute top-10 right-10 rounded-[4px] border border-white px-2 py-0.5 text-[11px] tracking-[0.9px] text-white uppercase">
                    Most asked for
                  </span>
                )}
                <span className="grid size-12 place-items-center rounded-[4px] border border-[#4e4e4e]/60 text-g4">
                  <ContentIcon name={service.icon} className="size-6" />
                </span>
                <div className="flex flex-col gap-4">
                  <h2 className="text-[40px] leading-[46px] tracking-[-1.2px] text-g1">{service.title}</h2>
                  {service.summary && <p className="text-[18px] leading-[28px] text-g2">{service.summary}</p>}
                </div>

                {service.image.url && (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-[4px] bg-[#d9d9d9]">
                    <Image
                      src={service.image.url}
                      alt={service.image.alt || service.title}
                      fill
                      sizes="670px"
                      className="object-cover"
                    />
                  </div>
                )}

                {service.deliverables.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[16px] leading-[24px] text-g2">
                        <span aria-hidden className="mt-[10px] size-1.5 shrink-0 rounded-full bg-g1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {service.details && <Markdown content={service.details} className="text-[16px]!" />}

                {(service.price.amount || service.price.note) && (
                  <div className="mt-auto flex flex-col gap-1 border-t border-[#4e4e4e]/50 pt-6">
                    {service.price.amount && (
                      <p className="text-[28px] leading-[1.2] text-g1">
                        {service.price.amount}
                        {service.price.unit && <span className="text-[16px] text-g2"> {service.price.unit}</span>}
                      </p>
                    )}
                    {service.price.note && <p className="text-[14px] text-g2">{service.price.note}</p>}
                  </div>
                )}

                <div className="flex">
                  <OutlineButton label="Start a project" href="/contact" className="w-[226px]" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {settings.process.length > 0 && (
          <div className="mt-[136px]">
            <Process
              eyebrow={settings.sectionCopy.process.eyebrow}
              heading={settings.sectionCopy.process.heading}
              intro={settings.sectionCopy.process.intro}
              steps={processSteps(settings)}
            />
          </div>
        )}

        {faqs.length > 0 && (
          <section aria-labelledby="faq-heading" className="mx-auto mt-[136px] w-full max-w-[1440px] px-10">
            <p data-reveal="fade" className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">
              {`/     ${settings.sectionCopy.faq.eyebrow || "FAQ"}`}
            </p>
            <h2 id="faq-heading" data-reveal="lines" className="mt-2 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
              {settings.sectionCopy.faq.heading || "Questions, answered."}
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

        <div className="mt-[136px]">
          <Contact
            eyebrow={settings.sectionCopy.contact.eyebrow}
            heading={settings.sectionCopy.contact.heading}
            intro={settings.sectionCopy.contact.intro}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        </div>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}

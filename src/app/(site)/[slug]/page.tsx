import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { getChrome } from "@/lib/chrome";
import { getPageBySlug, getPublishedPages } from "@/lib/content/public";
import { formatDate } from "@/lib/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await getPublishedPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPageBySlug(slug);
  if (!result || !("item" in result)) return {};
  const page = result.item;
  const title = page.seo.title || page.title;
  const description = page.seo.description || page.intro;
  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title, description, url: `/${page.slug}`, ...(page.seo.ogImage ? { images: [page.seo.ogImage] } : {}) },
    ...(page.seo.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Pages written in the admin panel — a privacy policy, terms, anything else. */
export default async function CustomPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const result = await getPageBySlug(slug);
  if (!result) notFound();
  // The slug changed in the admin panel: the old address keeps working.
  if ("redirectTo" in result) permanentRedirect(result.redirectTo);

  const page = result.item;
  const chrome = await getChrome();

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <article className="mx-auto w-full max-w-[1440px] px-10 pt-[260px]">
          <div className="mx-auto w-[820px]">
            <p data-reveal="fade" className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">
              {"/     Page"}
            </p>
            <h1 data-reveal="lines" className="mt-4 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
              {page.title}
            </h1>
            {page.intro && (
              <p data-reveal="lines" data-reveal-delay="0.15" className="mt-6 text-[18px] leading-[28px] text-g2">
                {page.intro}
              </p>
            )}
            {page.publishedAt && (
              <p className="mt-8 text-[14px] text-g2">
                Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt || page.publishedAt)}</time>
              </p>
            )}
            <span aria-hidden data-reveal="line-x" className="mt-12 block h-px w-full bg-[#4e4e4e]/50" />
            <div className="mt-12">
              <Markdown content={page.content} />
            </div>
          </div>
        </article>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}

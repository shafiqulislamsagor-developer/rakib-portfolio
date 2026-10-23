import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import SmartImage from "@/components/smart-image";
import ShareButtons from "@/app/(site)/share-buttons";
import { getChrome } from "@/lib/chrome";
import { getPostBySlug, getProfile, getPublishedPosts, getRelatedPosts } from "@/lib/content/public";
import { formatDate, jsonLd } from "@/lib/format";
import { absoluteUrl } from "@/lib/images";
import { markdownHeadings } from "@/lib/markdown";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result || !("item" in result)) return {};
  const siteUrl = await getSiteUrl();
  const post = result.item;
  const title = post.seo.title || post.title;
  const description = (post.seo.description || post.excerpt).slice(0, 160);
  const image = post.seo.ogImage || post.coverImage.url;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/blog/${post.slug}`,
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      modifiedTime: post.updatedAt,
      tags: post.tags,
      ...(image ? { images: [{ url: absoluteUrl(image, siteUrl), alt: post.title }] } : {}),
    },
    ...(post.seo.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) notFound();
  // The slug changed in the admin panel: the old address keeps working.
  if ("redirectTo" in result) permanentRedirect(result.redirectTo);

  const post = result.item;
  const [chrome, related, profile, siteUrl] = await Promise.all([
    getChrome(),
    getRelatedPosts(post),
    getProfile(),
    getSiteUrl(),
  ]);
  const headings = markdownHeadings(post.content);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/blog/${post.slug}`,
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt,
    ...(post.coverImage.url ? { image: absoluteUrl(post.coverImage.url, siteUrl) } : {}),
    author: { "@type": "Person", name: profile.name, url: siteUrl },
    keywords: post.tags.join(", "),
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
  };

  return (
    <div className="relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <article className="mx-auto w-full max-w-[1440px] px-10 pt-[260px]">
          {/* The article sits in one 820px measure, centred on the canvas. */}
          <div className="mx-auto w-[820px]">
            <Link
              href="/blog"
              className="mb-12 inline-flex items-center gap-2 text-[14px] text-g2 transition-colors hover:text-mist"
            >
              <ArrowLeft className="size-4" /> All articles
            </Link>
            <p data-reveal="fade" className="text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">
              {`/     ${post.category || "Article"}`}
            </p>
            <h1 data-reveal="lines" className="mt-4 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
              {post.title}
            </h1>
            {post.excerpt && (
              <p data-reveal="lines" data-reveal-delay="0.15" className="mt-6 text-[18px] leading-[28px] text-g2">
                {post.excerpt}
              </p>
            )}
            <p data-reveal="fade" className="mt-8 flex items-center gap-4 text-[14px] text-g2">
              <span>{profile.name}</span>
              <span aria-hidden>/</span>
              <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
              <span aria-hidden>/</span>
              <span>{post.readingMinutes} min read</span>
            </p>

            {post.coverImage.url && (
              <div data-reveal="clip" className="relative mt-14 aspect-[16/9] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
                <SmartImage
                  src={post.coverImage.url}
                  alt={post.coverImage.alt || ""}
                  fill
                  priority
                  sizes="820px"
                  className="object-cover"
                />
              </div>
            )}

            {headings.length >= 3 && (
              <nav
                aria-label="Table of contents"
                className="mt-14 rounded-[4px] border border-[#989898]/30 bg-[#989898]/10 p-6 backdrop-blur-[27.5px]"
              >
                <p className="text-[12px] tracking-[1.26px] whitespace-pre text-g3 uppercase">{"/     On this page"}</p>
                <ol className="mt-4 space-y-2 text-[16px]">
                  {headings.map((heading) => (
                    <li key={heading.id} className={heading.level === 3 ? "pl-5" : ""}>
                      <a href={`#${heading.id}`} className="text-g2 transition-colors hover:text-mist">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-14">
              <Markdown content={post.content} />
            </div>

            <div className="mt-16 flex flex-col gap-6 border-t border-[#4e4e4e]/50 pt-8 sm:flex-row sm:items-center sm:justify-between">
              {post.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-3" aria-label="Tags">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center rounded-[4px] border border-[#a0a0a0] p-[7px] text-[12px] tracking-[0.1px] text-g4 transition-colors duration-300 ease-figma-out hover:border-white hover:text-white"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <span />
              )}
              <ShareButtons url={`${siteUrl}/blog/${post.slug}`} title={post.title} />
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mx-auto mt-[136px] w-full max-w-[1440px] px-10">
            <span aria-hidden data-reveal="line-x" className="block h-px w-full bg-[#4e4e4e]/50" />
            <p data-reveal="fade" className="mt-12 text-[16px] tracking-[1.26px] whitespace-pre text-g3 uppercase">
              {"/     Keep reading"}
            </p>
            <h2
              id="related-heading"
              data-reveal="lines"
              className="mt-2 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
            >
              Related articles
            </h2>
            <ul className="mt-12 grid grid-cols-3 gap-5">
              {related.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={`/blog/${item.slug}`}
                    data-reveal="up"
                    data-reveal-delay={String(index * 0.08)}
                    className="group flex h-full flex-col gap-4 rounded-[4px] border border-[#4e4e4e]/50 p-7 transition-colors duration-300 ease-figma-out hover:border-[#4e4e4e]"
                  >
                    <span className="text-[14px] text-g2">{formatDate(item.publishedAt)}</span>
                    <span className="text-[28px] leading-[34px] tracking-[-0.5px] text-g2 transition-colors duration-300 ease-figma-out group-hover:text-mist">
                      {item.title}
                    </span>
                    {item.excerpt && <span className="text-[16px] leading-[24px] text-g2">{item.excerpt}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { getChrome } from "@/lib/chrome";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getPublishedPosts, getSiteSettings } from "@/lib/content/public";
import BlogExplorer from "./blog-explorer";

export const revalidate = 600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("blog", "/blog", "Blog");
}

export default async function BlogPage() {
  const [chrome, settings, posts] = await Promise.all([getChrome(), getSiteSettings(), getPublishedPosts()]);
  const copy = settings.sectionCopy.blog;

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <PageHero
          eyebrow={copy.eyebrow || "Blog"}
          heading={copy.heading || settings.pages.blog.title || "Notes on design"}
          intro={copy.intro}
        />
        <div className="mt-20">
          <Suspense fallback={<p className="mx-auto max-w-[1440px] px-10 text-[16px] text-g2">Loading articles…</p>}>
            <BlogExplorer posts={posts} />
          </Suspense>
        </div>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import type { PageSeoKey } from "@/types/content";
import { getSiteSettings } from "./public";

/** Metadata for a built-in page from Admin → SEO (title, description, share image, noindex). */
export async function builtInPageMetadata(key: PageSeoKey, path: string, fallbackTitle: string): Promise<Metadata> {
  const { pages, seo } = await getSiteSettings();
  const page = pages[key];
  const title = page.title || fallbackTitle;
  const description = page.description || seo.description;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, ...(page.ogImage ? { images: [page.ogImage] } : {}) },
    ...(page.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

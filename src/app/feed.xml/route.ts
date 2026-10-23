import { getProfile, getPublishedPosts, getSiteSettings } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 300;

const escape = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);

/** RSS 2.0 feed of published blog posts. */
export async function GET() {
  const [posts, settings, profile, siteUrl] = await Promise.all([getPublishedPosts(), getSiteSettings(), getProfile(), getSiteUrl()]);
  const items = posts
    .slice(0, 50)
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ""}
      <description>${escape(post.excerpt)}</description>
      ${post.category ? `<category>${escape(post.category)}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(settings.pages.blog.title || "Blog")} — ${escape(settings.siteName)}</title>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escape(settings.pages.blog.description || settings.siteDescription)}</description>
    <language>en</language>
    <managingEditor>${escape(profile.email)} (${escape(profile.name)})</managingEditor>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

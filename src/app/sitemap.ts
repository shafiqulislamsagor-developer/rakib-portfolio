import { getProfile, getPublishedPages, getPublishedPosts, getPublishedProjects, getSiteSettings } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export const revalidate = 600;

const latest = (...dates: (string | null | undefined)[]) => {
  const valid = dates.filter((date): date is string => Boolean(date)).sort();
  return valid.length ? new Date(valid[valid.length - 1]) : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, settings, profile, pages, siteUrl] = await Promise.all([
    getPublishedProjects(),
    getPublishedPosts(),
    getSiteSettings(),
    getProfile(),
    getPublishedPages(),
    getSiteUrl(),
  ]);
  if (!settings.seo.allowIndexing) return [];

  const projectEntries = projects
    .filter((project) => !project.seo.noIndex)
    .map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: latest(project.updatedAt, project.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const postEntries = posts
    .filter((post) => !post.seo.noIndex)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: latest(post.updatedAt, post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const builtIn = (["about", "services", "contact", "resume"] as const)
    .filter((key) => !settings.pages[key].noIndex)
    .map((key) => ({
      url: `${siteUrl}/${key}`,
      lastModified: latest(settings.updatedAt, profile.updatedAt),
      changeFrequency: "monthly" as const,
      priority: key === "contact" ? 0.6 : 0.8,
    }));

  const customPages = pages
    .filter((page) => !page.seo.noIndex)
    .map((page) => ({ url: `${siteUrl}/${page.slug}`, lastModified: latest(page.updatedAt), changeFrequency: "yearly" as const, priority: 0.3 }));

  return [
    {
      url: siteUrl,
      lastModified: latest(settings.updatedAt, profile.updatedAt, ...projects.map((project) => project.updatedAt)),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(settings.pages.projects.noIndex
      ? []
      : [{ url: `${siteUrl}/projects`, lastModified: latest(...projects.map((p) => p.updatedAt)), changeFrequency: "weekly" as const, priority: 0.8 }]),
    ...(posts.length && !settings.pages.blog.noIndex
      ? [{ url: `${siteUrl}/blog`, lastModified: latest(...posts.map((p) => p.publishedAt)), changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
    ...builtIn,
    ...projectEntries,
    ...postEntries,
    ...customPages,
  ];
}

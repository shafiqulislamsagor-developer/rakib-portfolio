import { cache } from "react";
import {
  defaultEducation,
  defaultExperience,
  defaultFaqs,
  defaultPages,
  defaultPosts,
  defaultProfile,
  defaultProjects,
  defaultServices,
  defaultSettings,
  defaultSkills,
  defaultTestimonials,
} from "@/data/defaults";
import type { FaqPlacement } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Education, Experience, Faq, Page, Post, Profile, Project, Service, Settings, Skill, Testimonial } from "@/lib/db/models";
import {
  toEducation,
  toExperience,
  toFaq,
  toPage,
  toService,
  toTestimonial,
  toPost,
  toProfile,
  toProject,
  toSettings,
  toSkill,
} from "@/lib/db/serialize";
import { isDbConfigured } from "@/lib/env";
import type { PageData, PostData, ProjectData } from "@/types/content";

/*
 * Read-only queries for the public website. Pages using these are statically
 * rendered with ISR and refreshed on demand (`revalidatePath`) whenever
 * content changes in the admin panel. Without MONGODB_URI the original
 * hard-coded content is served so the site keeps working.
 */

export const getSiteSettings = cache(async () => {
  if (!isDbConfigured()) return defaultSettings;
  await connectDB();
  return toSettings(await Settings.findOne({ key: "main" }).lean());
});

export const getProfile = cache(async () => {
  if (!isDbConfigured()) return defaultProfile;
  await connectDB();
  return toProfile(await Profile.findOne({ key: "main" }).lean());
});

export const getPublishedProjects = cache(async (): Promise<ProjectData[]> => {
  if (!isDbConfigured()) return defaultProjects;
  await connectDB();
  const docs = await Project.find({ status: "published" }).sort({ order: 1, publishedAt: -1 }).lean();
  return docs.map(toProject);
});

export const getHomeProjects = cache(async () => {
  const projects = await getPublishedProjects();
  const featured = projects.filter((project) => project.featured);
  return featured.length ? featured : projects;
});

export type SlugLookup<T> = { item: T } | { redirectTo: string } | null;

export const getProjectBySlug = cache(async (slug: string): Promise<SlugLookup<ProjectData>> => {
  if (!isDbConfigured()) {
    const item = defaultProjects.find((project) => project.slug === slug);
    return item ? { item } : null;
  }
  await connectDB();
  const doc = await Project.findOne({ slug, status: "published" }).lean();
  if (doc) return { item: toProject(doc) };
  const moved = await Project.findOne({ previousSlugs: slug, status: "published" }).select("slug").lean();
  return moved ? { redirectTo: `/projects/${moved.slug}` } : null;
});

export const getSkills = cache(async () => {
  if (!isDbConfigured()) return defaultSkills;
  await connectDB();
  const docs = await Skill.find({ status: "active" }).sort({ order: 1, name: 1 }).lean();
  return docs.map(toSkill);
});

export const getExperience = cache(async () => {
  if (!isDbConfigured()) return defaultExperience;
  await connectDB();
  const docs = await Experience.find({ status: "active" }).sort({ order: 1, startDate: -1 }).lean();
  return docs.map(toExperience);
});

export const getEducation = cache(async () => {
  if (!isDbConfigured()) return defaultEducation;
  await connectDB();
  const docs = await Education.find({ status: "active" }).sort({ order: 1, endDate: -1, startDate: -1 }).lean();
  return docs.map(toEducation);
});

/** Published posts plus scheduled posts whose publish time has passed. */
export function visiblePostFilter(now = new Date()) {
  return { $or: [{ status: "published" }, { status: "scheduled", publishAt: { $lte: now } }] };
}

export const getPublishedPosts = cache(async (): Promise<PostData[]> => {
  if (!isDbConfigured()) return defaultPosts;
  await connectDB();
  const docs = await Post.find(visiblePostFilter())
    .select("-content")
    .sort({ publishedAt: -1, publishAt: -1 })
    .lean();
  return docs.map(toPost).sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
});

export const getPostBySlug = cache(async (slug: string): Promise<SlugLookup<PostData>> => {
  if (!isDbConfigured()) {
    const item = defaultPosts.find((post) => post.slug === slug);
    return item ? { item } : null;
  }
  await connectDB();
  const doc = await Post.findOne({ slug, ...visiblePostFilter() }).lean();
  if (doc) return { item: toPost(doc) };
  const moved = await Post.findOne({ previousSlugs: slug, ...visiblePostFilter() }).select("slug").lean();
  return moved ? { redirectTo: `/blog/${moved.slug}` } : null;
});

export async function getRelatedPosts(post: PostData, limit = 3) {
  const posts = await getPublishedPosts();
  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      candidate,
      score:
        candidate.tags.filter((tag) => post.tags.includes(tag)).length * 2 +
        (candidate.category && candidate.category === post.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (b.candidate.publishedAt ?? "").localeCompare(a.candidate.publishedAt ?? ""))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export const getServices = cache(async () => {
  if (!isDbConfigured()) return defaultServices;
  await connectDB();
  const docs = await Service.find({ status: "active" }).sort({ order: 1, createdAt: 1 }).lean();
  return docs.map(toService);
});

export const getTestimonials = cache(async () => {
  if (!isDbConfigured()) return defaultTestimonials;
  await connectDB();
  const docs = await Testimonial.find({ status: "active" }).sort({ order: 1, createdAt: -1 }).lean();
  return docs.map(toTestimonial);
});

export const getFaqs = cache(async (placement?: FaqPlacement) => {
  const faqs = isDbConfigured()
    ? (await connectDB(), (await Faq.find({ status: "active" }).sort({ order: 1, createdAt: 1 }).lean()).map(toFaq))
    : defaultFaqs;
  return placement ? faqs.filter((faq) => faq.placements.includes(placement)) : faqs;
});

export const getPublishedPages = cache(async (): Promise<PageData[]> => {
  if (!isDbConfigured()) return defaultPages.filter((page) => page.status === "published");
  await connectDB();
  const docs = await Page.find({ status: "published" }).select("-content").sort({ title: 1 }).lean();
  return docs.map(toPage);
});

export const getPageBySlug = cache(async (slug: string): Promise<SlugLookup<PageData>> => {
  if (!isDbConfigured()) {
    const item = defaultPages.find((page) => page.slug === slug && page.status === "published");
    return item ? { item } : null;
  }
  await connectDB();
  const doc = await Page.findOne({ slug, status: "published" }).lean();
  if (doc) return { item: toPage(doc) };
  const moved = await Page.findOne({ previousSlugs: slug, status: "published" }).select("slug").lean();
  return moved ? { redirectTo: `/${moved.slug}` } : null;
});

/** Companies from the experience timeline, for the "worked with" strip. */
export async function getCompanies() {
  const experience = await getExperience();
  return [...new Set(experience.map((job) => job.company).filter(Boolean))];
}

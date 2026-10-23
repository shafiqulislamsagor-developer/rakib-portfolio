import type {
  EducationData,
  ExperienceData,
  FaqData,
  PageData,
  PostData,
  ProjectData,
  ServiceData,
  SkillData,
  TestimonialData,
} from "@/types/content";
import { starterProfile, starterSettings } from "./starter";
import {
  starterEducation,
  starterExperience,
  starterFaqs,
  starterPages,
  starterPosts,
  starterProjects,
  starterServices,
  starterSkills,
  starterTestimonials,
} from "./starter-content";

/**
 * The content the site falls back to when MONGODB_URI is not configured, so
 * the public pages still render during setup or a database outage. It is the
 * same starter dataset `pnpm db:seed` writes to MongoDB, so what you see
 * without a database is what you get with one.
 *
 * Everything here is editable at /admin once the database is connected —
 * these values are only the starting point.
 */

export const defaultProfile = starterProfile;
export const defaultSettings = starterSettings;

/** Ids are synthesised from the slug/name: without a database there is no ObjectId. */
const EPOCH = "2026-01-01T00:00:00.000Z";

export const defaultProjects: ProjectData[] = starterProjects.map((project) => ({
  ...project,
  id: project.slug,
  createdAt: project.publishedAt ?? EPOCH,
  updatedAt: project.publishedAt ?? EPOCH,
}));

export const defaultPosts: PostData[] = starterPosts
  .filter((post) => post.status === "published")
  .map((post) => ({ ...post, id: post.slug, createdAt: post.publishedAt ?? EPOCH, updatedAt: post.publishedAt ?? EPOCH }));

export const defaultSkills: SkillData[] = starterSkills.map((skill) => ({ ...skill, id: skill.name }));

export const defaultExperience: ExperienceData[] = starterExperience.map((job, index) => ({ ...job, id: `experience-${index}` }));

export const defaultEducation: EducationData[] = starterEducation.map((item, index) => ({ ...item, id: `education-${index}` }));

export const defaultServices: ServiceData[] = starterServices.map((service, index) => ({ ...service, id: `service-${index}` }));

export const defaultTestimonials: TestimonialData[] = starterTestimonials.map((item, index) => ({ ...item, id: `testimonial-${index}` }));

export const defaultFaqs: FaqData[] = starterFaqs.map((faq, index) => ({ ...faq, id: `faq-${index}` }));

export const defaultPages: PageData[] = starterPages.map((page) => ({
  ...page,
  id: page.slug,
  createdAt: page.publishedAt ?? EPOCH,
  updatedAt: page.publishedAt ?? EPOCH,
}));

/**
 * Settings values shipped before the multi-page upgrade. `pnpm db:seed` uses
 * them to recognise a database whose navigation and homepage order were never
 * customised, so it can safely replace them with the current defaults.
 */
export const legacyNavigation = [
  { label: "About", href: "/#about", visible: true },
  { label: "Experience", href: "/#experience", visible: true },
  { label: "Work", href: "/#projects", visible: true },
  { label: "Blog", href: "/blog", visible: true },
  { label: "Contact", href: "/#contact", visible: true },
];
export const legacyHomeSectionOrder = ["hero", "about", "experience", "education", "projects", "blog", "contact"];

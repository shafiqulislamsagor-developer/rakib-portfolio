import { z } from "zod";
import {
  EDUCATION_KINDS,
  EXPERIENCE_TYPES,
  FAQ_PLACEMENTS,
  HOME_SECTIONS,
  ITEM_STATUSES,
  RESUME_SECTIONS,
  RESUME_TEMPLATES,
  POST_STATUSES,
  PROJECT_STATUSES,
  RESERVED_SLUGS,
  SOCIAL_PLATFORMS,
  STRENGTH_ICONS,
  THEME_MODES,
  VISITOR_RETENTION_CHOICES,
} from "@/lib/constants";
import { isValidTimeZone } from "@/lib/db/runtime-cache";
import { THEME_PRESET_KEYS } from "@/lib/theme";
import {
  assetUrl,
  httpUrl,
  imageAssetSchema,
  monthSchema,
  optionalMonthSchema,
  orderSchema,
  requiredText,
  safeHref,
  seoSchema,
  slugSchema,
  stringList,
  text,
} from "./common";

export const projectSchema = z.object({
  title: requiredText(2, 160, "Title"),
  slug: slugSchema,
  summary: requiredText(10, 1200, "Summary"),
  content: z.string().max(50000, "Case study is too long"),
  category: text(60),
  technologies: stringList(30, 40),
  role: text(120),
  client: text(120),
  year: text(20),
  thumbnail: imageAssetSchema,
  cover: imageAssetSchema,
  gallery: z.array(imageAssetSchema).max(20, "Up to 20 gallery images"),
  /*
   * The case-study blocks. Both are always sent (the form has fields for
   * them); leaving them empty is how a project skips those sections.
   */
  process: z.object({
    body: text(4000),
    images: z.array(imageAssetSchema).max(3, "Up to 3 process shots"),
  }),
  fullPreview: imageAssetSchema,
  liveUrl: httpUrl,
  repoUrl: httpUrl,
  featured: z.boolean(),
  order: orderSchema,
  status: z.enum(PROJECT_STATUSES),
  seo: seoSchema,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const postSchema = z
  .object({
    title: requiredText(2, 160, "Title"),
    slug: slugSchema,
    excerpt: text(400),
    content: z.string().max(100000, "Article is too long"),
    coverImage: imageAssetSchema,
    category: text(60),
    tags: stringList(15, 40),
    status: z.enum(POST_STATUSES),
    publishAt: z.union([z.string().datetime({ offset: true }), z.literal("")]),
    seo: seoSchema,
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.publishAt) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "Pick a publish date for scheduled posts" });
    }
    if ((value.status === "published" || value.status === "scheduled") && value.content.trim().length < 20) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "Write at least a few sentences before publishing" });
    }
  });
export type PostInput = z.infer<typeof postSchema>;

export const skillSchema = z.object({
  name: requiredText(1, 60, "Name"),
  category: requiredText(1, 60, "Category"),
  level: z.number().int().min(0).max(100).nullable(),
  /** Only skills with a logo become the About-page tool discs; an empty one is fine. */
  icon: imageAssetSchema,
  featured: z.boolean(),
  order: orderSchema,
  status: z.enum(ITEM_STATUSES),
});
export type SkillInput = z.infer<typeof skillSchema>;

const progressionSchema = z.object({
  title: requiredText(1, 120, "Role title"),
  startDate: monthSchema,
  endDate: optionalMonthSchema,
});

export const experienceSchema = z
  .object({
    type: z.enum(EXPERIENCE_TYPES),
    title: requiredText(2, 120, "Title"),
    company: requiredText(1, 120, "Company"),
    companyUrl: httpUrl,
    location: text(160),
    startDate: monthSchema,
    endDate: optionalMonthSchema,
    description: text(2000),
    achievements: stringList(12, 300),
    progression: z.array(progressionSchema).max(10),
    technologies: stringList(30, 40),
    order: orderSchema,
    status: z.enum(ITEM_STATUSES),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const educationSchema = z
  .object({
    kind: z.enum(EDUCATION_KINDS),
    title: requiredText(2, 160, "Title"),
    institution: text(160),
    location: text(160),
    startDate: optionalMonthSchema,
    endDate: optionalMonthSchema,
    credentialId: text(120),
    credentialUrl: httpUrl,
    description: text(2000),
    order: orderSchema,
    status: z.enum(ITEM_STATUSES),
  })
  .refine((value) => !value.endDate || !value.startDate || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });
export type EducationInput = z.infer<typeof educationSchema>;

const linkSchema = z.object({ label: text(60), href: safeHref });

export const profileSchema = z.object({
  name: requiredText(2, 80, "Name"),
  shortName: requiredText(1, 40, "Short name"),
  title: requiredText(2, 80, "Professional title"),
  availability: text(140),
  location: text(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(160),
  phone: text(40),
  headline: requiredText(2, 160, "Headline"),
  headlineHighlight: text(60),
  intro: text(600),
  aboutBody: text(1200),
  bio: z.string().max(10000),
  strengths: z
    .array(z.object({ title: requiredText(1, 80, "Title"), copy: text(300), icon: z.enum(STRENGTH_ICONS) }))
    .max(6),
  highlights: z.array(z.object({ value: requiredText(1, 20, "Value"), label: requiredText(1, 80, "Label") })).max(6),
  avatar: imageAssetSchema,
  cv: z.object({ url: assetUrl, fileName: text(160) }),
  socials: z
    .array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), label: text(80), url: httpUrl.refine(Boolean, "URL is required") }))
    .max(12),
  primaryCta: linkSchema,
  secondaryCta: linkSchema,
  heroCode: z.object({
    focus: text(60),
    craft: stringList(6, 30),
    backend: text(60),
    status: text(40),
  }),
});
export type ProfileInput = z.infer<typeof profileSchema>;

const sectionCopySchema = z.object({ eyebrow: text(60), heading: text(140), intro: text(400) });

export const siteSettingsSchema = z.object({
  siteName: requiredText(2, 80, "Site name"),
  siteDescription: text(320),
  siteUrl: z
    .string()
    .trim()
    .max(2048)
    .transform((value) => value.replace(/\/+$/, ""))
    .refine((value) => value === "" || /^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(value), "Enter a full URL, e.g. https://your-domain.com"),
  logoText: text(12),
  logo: imageAssetSchema,
  faviconUrl: assetUrl,
  theme: z.object({ defaultMode: z.enum(THEME_MODES), preset: z.enum(THEME_PRESET_KEYS) }),
  navigation: z
    .array(z.object({ label: requiredText(1, 40, "Label"), href: safeHref.refine(Boolean, "Link is required"), visible: z.boolean() }))
    .max(10),
  footer: z.object({
    eyebrow: text(80),
    headline: text(160),
    highlight: text(60),
    blurb: text(300),
    ctaLabel: text(40),
    ctaHref: safeHref,
  }),
  homeSections: z
    .array(z.object({ key: z.enum(HOME_SECTIONS), visible: z.boolean() }))
    .refine(
      (sections) => new Set(sections.map((section) => section.key)).size === sections.length,
      "Each section can appear only once"
    ),
  sectionCopy: z.object({
    about: sectionCopySchema,
    experience: sectionCopySchema,
    education: sectionCopySchema,
    projects: sectionCopySchema,
    blog: sectionCopySchema,
    contact: sectionCopySchema,
    highlights: sectionCopySchema,
    services: sectionCopySchema,
    process: sectionCopySchema,
    testimonials: sectionCopySchema,
    faq: sectionCopySchema,
  }),
  contact: z.object({ formEnabled: z.boolean() }),
  voiceIntro: z
    .object({
      enabled: z.boolean(),
      // Same-origin only: the Content-Security-Policy sets `media-src 'self'`,
      // so audio hosted elsewhere would be blocked in the browser anyway.
      url: assetUrl.refine((value) => value === "" || value.startsWith("/"), "Upload the file here — audio hosted elsewhere is blocked by the site's security policy"),
      label: text(60),
      transcript: text(600),
      autoplay: z.boolean(),
      oncePerSession: z.boolean(),
    })
    .refine((value) => !value.enabled || Boolean(value.url), {
      path: ["url"],
      message: "Upload or choose an audio file before turning the greeting on",
    }),
  analytics: z.object({
    firstPartyEnabled: z.boolean(),
    visitorLogEnabled: z.boolean(),
    visitorRetention: z.enum(VISITOR_RETENTION_CHOICES),
    gaMeasurementId: z
      .string()
      .trim()
      .refine((value) => value === "" || /^G-[A-Z0-9]{4,20}$/.test(value), "GA4 IDs look like G-XXXXXXX"),
    timezone: z.string().trim().max(60).refine(isValidTimeZone, "Pick a valid IANA time zone, e.g. Asia/Dhaka"),
  }),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const resumeSettingsSchema = z.object({
  resume: z.object({
    template: z.enum(RESUME_TEMPLATES),
    sections: z
      .array(z.object({ key: z.enum(RESUME_SECTIONS), visible: z.boolean() }))
      .refine((sections) => new Set(sections.map((section) => section.key)).size === sections.length, "Each section can appear only once"),
    headline: text(160),
    summary: text(1200),
    projectLimit: z.number().int().min(1, "Show at least one project").max(12, "Twelve projects is the maximum"),
    featuredProjectsOnly: z.boolean(),
    showPhone: z.boolean(),
    showLocation: z.boolean(),
    showSocials: z.boolean(),
    showSkillLevels: z.boolean(),
  }),
});
export type ResumeSettingsInput = z.infer<typeof resumeSettingsSchema>;

export const seoSettingsSchema = z.object({
  seo: z.object({
    titleDefault: requiredText(2, 120, "Default title"),
    titleTemplate: text(120).refine((value) => value === "" || value.includes("%s"), "Template must include %s"),
    description: text(320),
    keywords: stringList(30, 60),
    ogImage: assetUrl,
    twitterHandle: z
      .string()
      .trim()
      .refine((value) => value === "" || /^@?[A-Za-z0-9_]{1,15}$/.test(value), "Enter a valid handle"),
    googleSiteVerification: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[A-Za-z0-9_-]{10,100}$/.test(value), "Paste only the content value"),
    allowIndexing: z.boolean(),
  }),
  pages: z.object({
    projects: seoSchema,
    blog: seoSchema,
    about: seoSchema,
    services: seoSchema,
    contact: seoSchema,
    resume: seoSchema,
  }),
});
export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;

export const serviceSchema = z.object({
  title: requiredText(2, 100, "Title"),
  summary: text(400),
  icon: z.enum(STRENGTH_ICONS),
  /** Left empty, the service row simply has no preview shot. */
  image: imageAssetSchema,
  deliverables: stringList(8, 80),
  price: z.object({ amount: text(40), unit: text(40), note: text(140) }),
  details: z.string().max(8000, "Details are too long"),
  popular: z.boolean(),
  featured: z.boolean(),
  order: orderSchema,
  status: z.enum(ITEM_STATUSES),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const processSchema = z.object({
  process: z
    .array(z.object({ title: requiredText(1, 80, "Step title"), description: text(400) }))
    .max(8, "Up to 8 steps"),
});
export type ProcessInput = z.infer<typeof processSchema>;

export const testimonialSchema = z.object({
  name: requiredText(2, 80, "Name"),
  role: text(100),
  company: text(100),
  avatar: imageAssetSchema,
  quote: requiredText(10, 1200, "Quote"),
  rating: z.number().int().min(1).max(5).nullable(),
  sourceUrl: httpUrl,
  projectSlug: z.union([slugSchema, z.literal("")]),
  featured: z.boolean(),
  order: orderSchema,
  status: z.enum(ITEM_STATUSES),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const faqSchema = z.object({
  question: requiredText(5, 200, "Question"),
  answer: requiredText(2, 3000, "Answer"),
  placements: z.array(z.enum(FAQ_PLACEMENTS)).min(1, "Show it on at least one page"),
  order: orderSchema,
  status: z.enum(ITEM_STATUSES),
});
export type FaqInput = z.infer<typeof faqSchema>;

export const pageSchema = z.object({
  title: requiredText(2, 160, "Title"),
  slug: slugSchema.refine((slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug), "This URL is used by the site — pick another"),
  intro: text(400),
  content: z.string().max(100000, "Page is too long"),
  status: z.enum(PROJECT_STATUSES),
  showInFooter: z.boolean(),
  seo: seoSchema,
});
export type PageInput = z.infer<typeof pageSchema>;

// Enumerations shared by models, validation schemas and UI.

export const PROJECT_STATUSES = ["draft", "published", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const ITEM_STATUSES = ["active", "archived"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const EXPERIENCE_TYPES = ["work", "internship", "freelance", "volunteer"] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export const EDUCATION_KINDS = ["education", "certification", "achievement"] as const;
export type EducationKind = (typeof EDUCATION_KINDS)[number];

export const MESSAGE_STATUSES = ["pending", "replied", "spam", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "whatsapp",
  "twitter",
  "facebook",
  "instagram",
  "youtube",
  "dribbble",
  "behance",
  "medium",
  "devto",
  "stackoverflow",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** How each platform is written out, when a profile link has no label of its own. */
export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  dribbble: "Dribbble",
  behance: "Behance",
  medium: "Medium",
  devto: "DEV",
  stackoverflow: "Stack Overflow",
  website: "Website",
};

/** Icons an admin can pick for strengths and services (rendered by components/content-icon). */
export const STRENGTH_ICONS = [
  "layers",
  "gauge",
  "blocks",
  "code",
  "server",
  "database",
  "globe",
  "sparkles",
  "shield",
  "rocket",
  "layout-dashboard",
  "shopping-cart",
  "smartphone",
  "palette",
  "workflow",
  "search",
  "cloud",
  "zap",
  "users",
  "message",
] as const;
export type StrengthIcon = (typeof STRENGTH_ICONS)[number];

/** Default (recommended) order of homepage sections. */
export const HOME_SECTIONS = [
  "hero",
  "highlights",
  "services",
  "projects",
  "about",
  "experience",
  "process",
  "testimonials",
  "education",
  "blog",
  "faq",
  "contact",
] as const;
export type HomeSectionKey = (typeof HOME_SECTIONS)[number];

/** Résumé layouts the admin picks from (app/(site)/resume/templates). */
export const RESUME_TEMPLATES = ["classic", "sidebar", "minimal", "timeline"] as const;
export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number];

export const RESUME_TEMPLATE_META: Record<ResumeTemplate, { label: string; description: string }> = {
  classic: { label: "Classic", description: "Section labels in a left column, content on the right. Roomy and easy to scan." },
  sidebar: { label: "Sidebar", description: "Experience and work in a wide column; skills, education and stats in a narrow one." },
  minimal: { label: "Minimal", description: "No card or colour — centred name, ruled headings. The safest to print or paste." },
  timeline: { label: "Timeline", description: "Roles and credentials run down a dotted line, newest first." },
};

/**
 * Blocks a résumé can contain, in the recommended order. Every one is built
 * from content that already lives on the site, so editing the site edits the
 * résumé (see lib/content/resume).
 */
export const RESUME_SECTIONS = [
  "summary",
  "highlights",
  "experience",
  "skills",
  "projects",
  "education",
  "certifications",
  "achievements",
  "services",
  "testimonials",
] as const;
export type ResumeSectionKey = (typeof RESUME_SECTIONS)[number];

export const RESUME_SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  highlights: "At a glance",
  experience: "Experience",
  skills: "Skills",
  projects: "Selected work",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  services: "What I do",
  testimonials: "References",
};

/** Blocks that belong in a narrow column when a template has one. */
export const ASIDE_SECTIONS: ResumeSectionKey[] = ["highlights", "skills", "education", "certifications", "achievements"];

export const FAQ_PLACEMENTS = ["home", "services", "contact"] as const;
export type FaqPlacement = (typeof FAQ_PLACEMENTS)[number];

/** First path segments owned by the app; custom pages cannot use them as slugs. */
export const RESERVED_SLUGS = [
  "about", "services", "projects", "blog", "contact", "resume", "admin", "api", "media", "cv",
  "feed.xml", "sitemap.xml", "robots.txt", "manifest.webmanifest", "opengraph-image", "twitter-image",
  "icon.svg", "favicon.ico", "_next", "uploads",
] as const;

export const THEME_MODES = ["dark", "light", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const ANALYTICS_METRICS = [
  "pageview",
  "visitor",
  "project_view",
  "post_view",
  "cv_download",
  "referrer",
  "country",
  "contact_submit",
] as const;
export type AnalyticsMetric = (typeof ANALYTICS_METRICS)[number];

/** Actions stored in the per-visitor log (see lib/analytics/visitors). */
export const VISITOR_EVENT_TYPES = ["pageview", "click", "outbound", "download", "form_submit", "copy"] as const;
export type VisitorEventType = (typeof VISITOR_EVENT_TYPES)[number];

export const DEVICE_TYPES = ["desktop", "mobile", "tablet", "unknown"] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/** Where a visitor came from, worked out from the referrer and UTM tags (see lib/analytics/source). */
export const SOURCE_CHANNELS = ["direct", "organic", "social", "ai", "campaign", "email", "referral"] as const;
export type SourceChannel = (typeof SOURCE_CHANNELS)[number];

/** What a visitor is worth to the business; derived from their own activity (see lib/analytics/status). */
export const VISITOR_STATUSES = ["new", "returning", "lead", "customer"] as const;
export type VisitorStatus = (typeof VISITOR_STATUSES)[number];

/** A visitor counts as online (an active session) when their last beacon arrived within this window. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** How long the visitor log may keep records (Settings -> Analytics), as day counts. */
export const VISITOR_RETENTION_CHOICES = ["30", "90", "180", "365"] as const;
export type VisitorRetention = (typeof VISITOR_RETENTION_CHOICES)[number];

/** How long the visitor log keeps people and their actions. */
export const VISITOR_LOG_TTL_SECONDS = 60 * 60 * 24 * 365;

export const ADMIN_ROLES = ["owner", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024; // Vercel request bodies max out at 4.5 MB.
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] as const;
export const DOCUMENT_MIME_TYPES = ["application/pdf"] as const;
/** For the spoken welcome (Admin → Settings → Voice greeting). */
export const AUDIO_MIME_TYPES = ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm"] as const;

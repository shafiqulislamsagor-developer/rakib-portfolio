import type {
  EducationKind,
  FaqPlacement,
  ExperienceType,
  HomeSectionKey,
  ItemStatus,
  MessageStatus,
  PostStatus,
  ProjectStatus,
  SocialPlatform,
  ResumeSectionKey,
  ResumeTemplate,
  StrengthIcon,
  ThemeMode,
  VisitorRetention,
} from "@/lib/constants";
import type { ThemePreset } from "@/lib/theme";

// Serialized (JSON-safe) shapes passed from the server to components.
// Dates are ISO strings; ids are hex strings.

export type ImageAsset = { url: string; alt: string };
export type SeoMeta = { title: string; description: string; ogImage: string; noIndex: boolean };
export type LinkItem = { label: string; href: string };

export interface ProfileData {
  name: string;
  shortName: string;
  title: string;
  availability: string;
  location: string;
  email: string;
  phone: string;
  headline: string;
  headlineHighlight: string;
  intro: string;
  aboutBody: string;
  bio: string;
  strengths: { title: string; copy: string; icon: StrengthIcon }[];
  highlights: { value: string; label: string }[];
  avatar: ImageAsset;
  cv: { url: string; fileName: string; updatedAt: string | null };
  socials: { platform: SocialPlatform; label: string; url: string }[];
  primaryCta: LinkItem;
  secondaryCta: LinkItem;
  heroCode: { focus: string; craft: string[]; backend: string; status: string };
  updatedAt?: string;
}

export type SectionCopy = { eyebrow: string; heading: string; intro: string };
export type SectionCopyKey =
  | "about"
  | "experience"
  | "education"
  | "projects"
  | "blog"
  | "contact"
  | "highlights"
  | "services"
  | "process"
  | "testimonials"
  | "faq";
export type PageSeoKey = "projects" | "blog" | "about" | "services" | "contact" | "resume";

/**
 * How the résumé is assembled. Only the arrangement lives here — every word of
 * content is read from the profile, experience, skills, projects and education
 * collections when the page renders, so the site and the résumé never drift.
 */
export interface ResumeSettings {
  template: ResumeTemplate;
  /** Every section, in print order, each either shown or hidden. */
  sections: { key: ResumeSectionKey; visible: boolean }[];
  /** Optional overrides for the two header-ish bits; blank falls back to the profile. */
  headline: string;
  summary: string;
  projectLimit: number;
  featuredProjectsOnly: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showSocials: boolean;
  showSkillLevels: boolean;
}

export type ResumeContact = { label: string; href: string };
export type ResumeRole = {
  id: string;
  title: string;
  org: string;
  orgUrl: string;
  period: string;
  location: string;
  description: string;
  bullets: string[];
};
export type ResumeSkillGroup = { category: string; items: { name: string; level: number | null }[] };
export type ResumeProject = { id: string; title: string; url: string; summary: string; tech: string[] };
export type ResumeCredential = { id: string; title: string; org: string; period: string; description: string; url: string };
export type ResumeQuote = { id: string; quote: string; name: string; role: string };

export type ResumeSection = { key: ResumeSectionKey; title: string } & (
  | { kind: "text"; body: string }
  | { kind: "stats"; items: { value: string; label: string }[] }
  | { kind: "roles"; items: ResumeRole[] }
  | { kind: "skills"; groups: ResumeSkillGroup[]; showLevels: boolean }
  | { kind: "projects"; items: ResumeProject[] }
  | { kind: "credentials"; items: ResumeCredential[] }
  | { kind: "list"; items: { title: string; summary: string }[] }
  | { kind: "quotes"; items: ResumeQuote[] }
);

export type Resume = {
  header: { name: string; headline: string; location: string; contacts: ResumeContact[]; cvUrl: string };
  sections: ResumeSection[];
};

export interface SiteSettingsData {
  siteName: string;
  siteDescription: string;
  /** Canonical public URL, set in Admin → Settings. Empty falls back to the host URL. */
  siteUrl: string;
  logoText: string;
  logo: ImageAsset;
  faviconUrl: string;
  theme: { defaultMode: ThemeMode; preset: ThemePreset };
  navigation: { label: string; href: string; visible: boolean }[];
  footer: {
    eyebrow: string;
    headline: string;
    highlight: string;
    blurb: string;
    ctaLabel: string;
    ctaHref: string;
  };
  homeSections: { key: HomeSectionKey; visible: boolean }[];
  sectionCopy: Record<SectionCopyKey, SectionCopy>;
  process: { title: string; description: string }[];
  seo: {
    titleDefault: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
    ogImage: string;
    twitterHandle: string;
    googleSiteVerification: string;
    allowIndexing: boolean;
  };
  pages: Record<PageSeoKey, SeoMeta>;
  contact: { formEnabled: boolean };
  /** A short spoken welcome played on the public site. */
  voiceIntro: {
    enabled: boolean;
    /** Audio file URL, usually /media/… from the library. */
    url: string;
    /** Text on the player button, e.g. "Play my welcome". */
    label: string;
    /** What the recording says — shown to anyone who cannot or will not play it. */
    transcript: string;
    /** Try to start on arrival. Browsers may refuse; the button always works. */
    autoplay: boolean;
    oncePerSession: boolean;
  };
  resume: ResumeSettings;
  analytics: {
    firstPartyEnabled: boolean;
    visitorLogEnabled: boolean;
    visitorRetention: VisitorRetention;
    gaMeasurementId: string;
    /** IANA zone for analytics day boundaries and admin timestamps. */
    timezone: string;
  };
  updatedAt?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  technologies: string[];
  role: string;
  client: string;
  year: string;
  thumbnail: ImageAsset;
  cover: ImageAsset;
  gallery: ImageAsset[];
  /** Case-study block: the Design Process copy with its three shots. */
  process: { body: string; images: ImageAsset[] };
  /** The one tall screenshot that closes the case study. */
  fullPreview: ImageAsset;
  liveUrl: string;
  repoUrl: string;
  featured: boolean;
  order: number;
  status: ProjectStatus;
  publishedAt: string | null;
  seo: SeoMeta;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: ImageAsset;
  category: string;
  tags: string[];
  status: PostStatus;
  publishAt: string | null;
  publishedAt: string | null;
  readingMinutes: number;
  seo: SeoMeta;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillData {
  id: string;
  name: string;
  category: string;
  level: number | null;
  /** Tool logo, shown inside the floating disc on the About page. */
  icon: ImageAsset;
  featured: boolean;
  order: number;
  status: ItemStatus;
}

export interface ExperienceData {
  id: string;
  type: ExperienceType;
  title: string;
  company: string;
  companyUrl: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements: string[];
  progression: { title: string; startDate: string; endDate: string | null }[];
  technologies: string[];
  order: number;
  status: ItemStatus;
}

export interface EducationData {
  id: string;
  kind: EducationKind;
  title: string;
  institution: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  credentialId: string;
  credentialUrl: string;
  description: string;
  order: number;
  status: ItemStatus;
}

export interface MessageData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  address: string;
  status: MessageStatus;
  read: boolean;
  readAt: string | null;
  repliedAt: string | null;
  notes: { id: string; body: string; authorEmail: string; createdAt: string }[];
  replies: { id: string; body: string; sentBy: string; sentAt: string }[];
  meta: { country: string; userAgent: string; spamScore: number; visitorId: string };
  createdAt: string;
}

export interface MediaData {
  id: string;
  url: string;
  resourceType: "image" | "audio" | "raw";
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  originalName: string;
  alt: string;
  caption: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ServiceData {
  id: string;
  title: string;
  summary: string;
  icon: StrengthIcon;
  /** Preview shot revealed when the service row expands on the home page. */
  image: ImageAsset;
  deliverables: string[];
  /** What it costs. All free text, so any currency or "From …" wording works. */
  price: { amount: string; unit: string; note: string };
  /** Long-form markdown shown under the card on /services. */
  details: string;
  /** Highlights this card as the recommended option. */
  popular: boolean;
  featured: boolean;
  order: number;
  status: ItemStatus;
}

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: ImageAsset;
  quote: string;
  rating: number | null;
  sourceUrl: string;
  projectSlug: string;
  featured: boolean;
  order: number;
  status: ItemStatus;
}

export interface FaqData {
  id: string;
  question: string;
  answer: string;
  placements: FaqPlacement[];
  order: number;
  status: ItemStatus;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  intro: string;
  content: string;
  status: ProjectStatus;
  showInFooter: boolean;
  publishedAt: string | null;
  seo: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

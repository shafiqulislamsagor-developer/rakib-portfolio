import { defaultProfile, defaultSettings } from "@/data/defaults";
import { HOME_SECTIONS, RESUME_SECTIONS } from "@/lib/constants";
import type {
  EducationData,
  FaqData,
  PageData,
  ServiceData,
  TestimonialData,
  ExperienceData,
  ImageAsset,
  MediaData,
  MessageData,
  PostData,
  ProfileData,
  ProjectData,
  SeoMeta,
  SiteSettingsData,
  SkillData,
} from "@/types/content";

type Plain = Record<string, unknown>;

/** JSON round-trip (ObjectId → hex, Date → ISO) and `_id` → `id` at every level. */
export function toPlain<T = Plain>(doc: unknown): T {
  const json = JSON.parse(JSON.stringify(doc ?? null));
  const rename = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rename);
    if (value && typeof value === "object") {
      const out: Plain = {};
      for (const [key, inner] of Object.entries(value as Plain)) {
        if (key === "__v") continue;
        out[key === "_id" ? "id" : key] = rename(inner);
      }
      return out;
    }
    return value;
  };
  return rename(json) as T;
}

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const bool = (value: unknown, fallback = false) => (typeof value === "boolean" ? value : fallback);
const strList = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
const dateOrNull = (value: unknown) => (typeof value === "string" && value ? value : null);
const image = (value: unknown): ImageAsset => {
  const v = (value ?? {}) as Plain;
  return { url: str(v.url), alt: str(v.alt) };
};
const seo = (value: unknown): SeoMeta => {
  const v = (value ?? {}) as Plain;
  return { title: str(v.title), description: str(v.description), ogImage: str(v.ogImage), noIndex: bool(v.noIndex) };
};
/** The case study's Design Process block: one paragraph and up to three shots. */
const processBlock = (value: unknown) => {
  const v = (value ?? {}) as Plain;
  return { body: str(v.body), images: Array.isArray(v.images) ? v.images.map(image) : [] };
};

/** Recursively fill `undefined`/`null` values from defaults; explicit values (even "") win. */
export function withDefaults<T>(defaults: T, value: unknown): T {
  if (value === undefined || value === null) return defaults;
  if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T;
  if (defaults && typeof defaults === "object") {
    const source = (typeof value === "object" ? value : {}) as Plain;
    const out: Plain = {};
    for (const key of Object.keys(defaults as Plain)) {
      out[key] = withDefaults((defaults as Plain)[key], source[key]);
    }
    return out as T;
  }
  return (typeof value === typeof defaults ? value : defaults) as T;
}

/**
 * Keep every known home section present, even ones introduced after the
 * settings were saved: a missing section is inserted right after the nearest
 * section that precedes it in the recommended order (instead of at the end).
 */
export function completeHomeSections(sections: SiteSettingsData["homeSections"]) {
  const result = sections.filter(
    (section, index) => HOME_SECTIONS.includes(section.key) && sections.findIndex((other) => other.key === section.key) === index
  );
  HOME_SECTIONS.forEach((key, position) => {
    if (result.some((section) => section.key === key)) return;
    const previous = HOME_SECTIONS.slice(0, position).reverse().find((candidate) => result.some((section) => section.key === candidate));
    const insertAt = previous ? result.findIndex((section) => section.key === previous) + 1 : 0;
    result.splice(insertAt, 0, { key, visible: true });
  });
  return result;
}

/**
 * Keep every résumé section present and in a sensible place, the same way
 * completeHomeSections does, so a section added in a later release appears for
 * admins whose settings were saved before it existed.
 */
export function completeResumeSections(sections: SiteSettingsData["resume"]["sections"]) {
  const result = sections
    .filter((section, index) => RESUME_SECTIONS.includes(section.key) && sections.findIndex((other) => other.key === section.key) === index)
    .map((section) => ({ key: section.key, visible: Boolean(section.visible) }));
  RESUME_SECTIONS.forEach((key, position) => {
    if (result.some((section) => section.key === key)) return;
    const previous = RESUME_SECTIONS.slice(0, position).reverse().find((candidate) => result.some((section) => section.key === candidate));
    const insertAt = previous ? result.findIndex((section) => section.key === previous) + 1 : 0;
    const fallback = defaultSettings.resume.sections.find((section) => section.key === key);
    result.splice(insertAt, 0, { key, visible: fallback?.visible ?? true });
  });
  return result;
}

export function toSettings(doc: unknown): SiteSettingsData {
  const settings = withDefaults(defaultSettings, doc ? toPlain(doc) : null);
  return {
    ...settings,
    homeSections: completeHomeSections(settings.homeSections),
    resume: { ...settings.resume, sections: completeResumeSections(settings.resume.sections) },
  };
}

export function toProfile(doc: unknown): ProfileData {
  return withDefaults(defaultProfile, doc ? toPlain(doc) : null);
}

export function toProject(doc: unknown): ProjectData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    title: str(v.title),
    slug: str(v.slug),
    summary: str(v.summary),
    content: str(v.content),
    category: str(v.category),
    technologies: strList(v.technologies),
    role: str(v.role),
    client: str(v.client),
    year: str(v.year),
    thumbnail: image(v.thumbnail),
    cover: image(v.cover),
    gallery: Array.isArray(v.gallery) ? v.gallery.map(image) : [],
    process: processBlock(v.process),
    fullPreview: image(v.fullPreview),
    liveUrl: str(v.liveUrl),
    repoUrl: str(v.repoUrl),
    featured: bool(v.featured),
    order: num(v.order),
    status: (str(v.status, "draft") as ProjectData["status"]),
    publishedAt: dateOrNull(v.publishedAt),
    seo: seo(v.seo),
    viewCount: num(v.viewCount),
    createdAt: str(v.createdAt),
    updatedAt: str(v.updatedAt),
  };
}

export function toPost(doc: unknown): PostData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    title: str(v.title),
    slug: str(v.slug),
    excerpt: str(v.excerpt),
    content: str(v.content),
    coverImage: image(v.coverImage),
    category: str(v.category),
    tags: strList(v.tags),
    status: (str(v.status, "draft") as PostData["status"]),
    publishAt: dateOrNull(v.publishAt),
    publishedAt: dateOrNull(v.publishedAt) ?? (v.status === "scheduled" ? dateOrNull(v.publishAt) : null),
    readingMinutes: num(v.readingMinutes, 1),
    seo: seo(v.seo),
    viewCount: num(v.viewCount),
    createdAt: str(v.createdAt),
    updatedAt: str(v.updatedAt),
  };
}

export function toSkill(doc: unknown): SkillData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    name: str(v.name),
    category: str(v.category, "Other"),
    level: typeof v.level === "number" ? v.level : null,
    icon: image(v.icon),
    featured: bool(v.featured),
    order: num(v.order),
    status: (str(v.status, "active") as SkillData["status"]),
  };
}

export function toExperience(doc: unknown): ExperienceData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    type: (str(v.type, "work") as ExperienceData["type"]),
    title: str(v.title),
    company: str(v.company),
    companyUrl: str(v.companyUrl),
    location: str(v.location),
    startDate: str(v.startDate),
    endDate: dateOrNull(v.endDate),
    description: str(v.description),
    achievements: strList(v.achievements),
    progression: Array.isArray(v.progression)
      ? v.progression.map((item: Plain) => ({
          title: str(item.title),
          startDate: str(item.startDate),
          endDate: dateOrNull(item.endDate),
        }))
      : [],
    technologies: strList(v.technologies),
    order: num(v.order),
    status: (str(v.status, "active") as ExperienceData["status"]),
  };
}

export function toEducation(doc: unknown): EducationData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    kind: (str(v.kind, "education") as EducationData["kind"]),
    title: str(v.title),
    institution: str(v.institution),
    location: str(v.location),
    startDate: dateOrNull(v.startDate),
    endDate: dateOrNull(v.endDate),
    credentialId: str(v.credentialId),
    credentialUrl: str(v.credentialUrl),
    description: str(v.description),
    order: num(v.order),
    status: (str(v.status, "active") as EducationData["status"]),
  };
}

export function toMessage(doc: unknown): MessageData {
  const v = toPlain<Plain>(doc);
  const meta = (v.meta ?? {}) as Plain;
  return {
    id: str(v.id),
    name: str(v.name),
    email: str(v.email),
    subject: str(v.subject),
    message: str(v.message),
    phone: str(v.phone),
    address: str(v.address),
    status: (str(v.status, "pending") as MessageData["status"]),
    read: bool(v.read),
    readAt: dateOrNull(v.readAt),
    repliedAt: dateOrNull(v.repliedAt),
    notes: Array.isArray(v.notes)
      ? v.notes.map((note: Plain) => ({
          id: str(note.id),
          body: str(note.body),
          authorEmail: str(note.authorEmail),
          createdAt: str(note.createdAt),
        }))
      : [],
    replies: Array.isArray(v.replies)
      ? v.replies.map((reply: Plain) => ({
          id: str(reply.id),
          body: str(reply.body),
          sentBy: str(reply.sentBy),
          sentAt: str(reply.sentAt),
        }))
      : [],
    meta: { country: str(meta.country), userAgent: str(meta.userAgent), spamScore: num(meta.spamScore), visitorId: str(meta.visitorId) },
    createdAt: str(v.createdAt),
  };
}

export function toMedia(doc: unknown): MediaData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    url: str(v.url),
    resourceType: v.resourceType === "raw" ? "raw" : "image",
    mimeType: str(v.mimeType),
    bytes: num(v.bytes),
    width: typeof v.width === "number" ? v.width : null,
    height: typeof v.height === "number" ? v.height : null,
    originalName: str(v.originalName),
    alt: str(v.alt),
    caption: str(v.caption),
    uploadedBy: str(v.uploadedBy),
    createdAt: str(v.createdAt),
  };
}

export function toService(doc: unknown): ServiceData {
  const v = toPlain<Plain>(doc);
  const price = (v.price ?? {}) as Plain;
  return {
    id: str(v.id),
    title: str(v.title),
    summary: str(v.summary),
    icon: str(v.icon, "code") as ServiceData["icon"],
    image: image(v.image),
    deliverables: strList(v.deliverables),
    price: { amount: str(price.amount), unit: str(price.unit), note: str(price.note) },
    details: str(v.details),
    popular: bool(v.popular),
    featured: bool(v.featured, true),
    order: num(v.order),
    status: str(v.status, "active") as ServiceData["status"],
  };
}

export function toTestimonial(doc: unknown): TestimonialData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    name: str(v.name),
    role: str(v.role),
    company: str(v.company),
    avatar: image(v.avatar),
    quote: str(v.quote),
    rating: typeof v.rating === "number" ? v.rating : null,
    sourceUrl: str(v.sourceUrl),
    projectSlug: str(v.projectSlug),
    featured: bool(v.featured, true),
    order: num(v.order),
    status: str(v.status, "active") as TestimonialData["status"],
  };
}

export function toFaq(doc: unknown): FaqData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    question: str(v.question),
    answer: str(v.answer),
    placements: strList(v.placements) as FaqData["placements"],
    order: num(v.order),
    status: str(v.status, "active") as FaqData["status"],
  };
}

export function toPage(doc: unknown): PageData {
  const v = toPlain<Plain>(doc);
  return {
    id: str(v.id),
    title: str(v.title),
    slug: str(v.slug),
    intro: str(v.intro),
    content: str(v.content),
    status: str(v.status, "draft") as PageData["status"],
    showInFooter: bool(v.showInFooter, true),
    publishedAt: dateOrNull(v.publishedAt),
    seo: seo(v.seo),
    createdAt: str(v.createdAt),
    updatedAt: str(v.updatedAt),
  };
}

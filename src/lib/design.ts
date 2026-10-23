import type { GlyphName } from "@/data/glyphs";
import { glyphSets } from "@/data/glyphs";
import type {
  ProfileData,
  ProjectData,
  ServiceData,
  SiteSettingsData,
  SkillData,
  TestimonialData,
} from "@/types/content";

/*
 * One place where the design's slots meet the content.
 *
 * The layout is a 1440px canvas taken from Figma: cards, discs and glass
 * marks sit at measured coordinates, and several sections hold a fixed number
 * of them. The geometry therefore stays here as constants, while everything
 * readable comes from the database (or, with no database configured, from the
 * same values in `data/starter*`). Each helper maps one to the other.
 */

// ------------------------------------------------------------------ Menu

/** The menu panel splits the navigation into a column of four and the rest. */
export function navColumns(settings: SiteSettingsData) {
  const links = settings.navigation.filter((item) => item.visible).map(({ label, href }) => ({ label, href }));
  return [links.slice(0, 4), links.slice(4)].filter((column) => column.length > 0);
}

/** Widths of the three project cards in the open menu panel. */
const NAV_CARD_WIDTHS = [427, 426, 427];

export function navProjects(projects: ProjectData[]) {
  return projects.slice(0, 3).map((project, index) => ({
    index: String(index + 1).padStart(2, "0"),
    title: project.title,
    image: cardImage(project),
    href: `/projects/${project.slug}`,
    w: NAV_CARD_WIDTHS[index] ?? 427,
  }));
}

// ------------------------------------------------------------------ Work

/** Thumbnail first, cover as the fallback — either may be empty. */
export function cardImage(project: ProjectData) {
  return project.thumbnail.url || project.cover.url;
}

export function works(projects: ProjectData[]) {
  return projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    image: cardImage(project),
    alt: project.thumbnail.alt || project.cover.alt || project.title,
    // The design shows two tags; the rest live on the case study.
    tags: (project.technologies.length ? project.technologies : [project.category]).filter(Boolean).slice(0, 2),
    href: `/projects/${project.slug}`,
  }));
}

export type Work = ReturnType<typeof works>[number];

// -------------------------------------------------------------- Services

export function serviceRows(services: ServiceData[]) {
  return services.map((service) => ({
    title: service.title,
    desc: service.summary,
    image: service.image.url,
    alt: service.image.alt || service.title,
    href: "/services",
  }));
}

export type ServiceRow = ReturnType<typeof serviceRows>[number];

// ---------------------------------------------------------- Testimonials

export function testimonialCards(items: TestimonialData[]) {
  return items.map((item) => ({
    name: item.name,
    role: [item.role, item.company].filter(Boolean).join(" at "),
    image: item.avatar.url,
    // Figma sets the quote in typographic quotes; the stored text has none.
    quote: `“${item.quote.replace(/^[“"]|[”"]$/g, "")}”`,
  }));
}

export type TestimonialCard = ReturnType<typeof testimonialCards>[number];

// ----------------------------------------------------- Why consider me

/**
 * Positions of the six glass cards inside the 1360px canvas, and the artwork
 * for each strength icon the admin can choose. Icons without their own
 * drawing fall back to the shared icon set (see ContentIcon).
 */
const REASON_POSITIONS = [
  { x: 506, y: 0 },
  { x: 0, y: 395 },
  { x: 924, y: 615 },
  { x: 115, y: 996 },
  { x: 575, y: 1329 },
  { x: 1035, y: 1608 },
];

const STRENGTH_ARTWORK: Partial<Record<ProfileData["strengths"][number]["icon"], string>> = {
  users: "/icons/favorite.svg",
  smartphone: "/icons/dual-screen.svg",
  code: "/icons/dev-mode.svg",
  palette: "/icons/graphic-design.svg",
  search: "/icons/ux.svg",
  cloud: "/icons/cloud-access.svg",
  message: "/icons/favorite.svg",
  layers: "/icons/graphic-design.svg",
};

export function reasons(profile: ProfileData) {
  return profile.strengths.slice(0, REASON_POSITIONS.length).map((strength, index) => ({
    title: strength.title,
    body: strength.copy,
    icon: strength.icon,
    artwork: STRENGTH_ARTWORK[strength.icon] ?? "",
    ...REASON_POSITIONS[index],
  }));
}

export type Reason = ReturnType<typeof reasons>[number];

// --------------------------------------------------------------- Toolkit

/**
 * Where the six tool discs land after they drop, and how big the logo inside
 * each one is. `outline` gives the label the halo the design uses on the
 * lighter marks.
 */
const TOOL_SLOTS = [
  { x: 287, y: 0, iw: 47.62, ih: 70, iy: 26, outline: true },
  { x: 211, y: 186, iw: 41, ih: 60, iy: 31, outline: true },
  { x: 86.69, y: 409.51, iw: 59.02, ih: 60, iy: 29.67, outline: false },
  { x: 437, y: 327, iw: 70, ih: 49, iy: 36.5, outline: false },
  { x: 191, y: 372, iw: 70, ih: 61, iy: 29.75, outline: false },
  { x: 0, y: 245, iw: 60, ih: 60, iy: 31, outline: true },
];

export function tools(skills: SkillData[]) {
  return skills
    .filter((skill) => skill.featured && skill.icon.url)
    .slice(0, TOOL_SLOTS.length)
    .map((skill, index) => ({ name: skill.name, icon: skill.icon.url, ...TOOL_SLOTS[index] }));
}

export type Tool = ReturnType<typeof tools>[number];

// --------------------------------------------------------------- Process

export function processSteps(settings: SiteSettingsData) {
  return settings.process.map((step, index) => ({
    index: String(index + 1).padStart(2, "0"),
    title: step.title,
    body: step.description,
  }));
}

export type ProcessStep = ReturnType<typeof processSteps>[number];

// ------------------------------------------------------------ Case study

/** The fact list beside the case-study hero. Empty fields are left out. */
export function projectFacts(project: ProjectData) {
  return [
    { label: "Industry", value: project.category ? [project.category] : [] },
    { label: "Services", value: project.technologies },
    { label: "Role", value: project.role ? [project.role] : [] },
    { label: "Client", value: project.client ? [project.client] : [] },
    { label: "Year", value: project.year ? [project.year] : [] },
  ].filter((fact) => fact.value.length > 0);
}

/**
 * Outlined title artwork, when a drawing exists for this project. Everything
 * else falls back to the same words set in the display face, so a project
 * added from the admin panel still gets a case-study title.
 */
export function titleArt(slug: string): { glyphs: GlyphName; x: number; y: number } | null {
  const positions: Partial<Record<GlyphName, { x: number; y: number }>> = {
    roofnest: { x: 64.06, y: 100.57 },
  };
  const name = slug as GlyphName;
  return name in glyphSets && positions[name] ? { glyphs: name, ...positions[name]! } : null;
}

/** The two previews that close a case study: the next project, then the one after. */
export function nextProjects(projects: ProjectData[], current: ProjectData) {
  const others = projects.filter((project) => project.slug !== current.slug);
  if (!others.length) return null;
  const index = projects.findIndex((project) => project.slug === current.slug);
  const ordered = [...others.slice(index), ...others.slice(0, index)];
  const pick = (project: ProjectData) => ({
    name: project.title,
    slug: project.slug,
    image: cardImage(project),
  });
  return { large: pick(ordered[0]), small: pick(ordered[1] ?? ordered[0]) };
}

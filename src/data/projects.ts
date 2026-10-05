import type { GlyphName } from "./glyphs";

export type Project = {
  slug: string;
  name: string;
  /** outlined title artwork exported from the design, split into letters */
  titleArt: { glyphs: GlyphName; x: number; y: number };
  facts: { label: string; value: string[] }[];
  website: { label: string; href: string };
  hero: string;
  overview: { lead: string; body: string };
  /** images or videos (.mp4 / .webm) — the large first slot is meant for either */
  gallery: string[];
  process: { body: string; images: string[] };
  fullPreview: string;
  next: { large: NextProject; small: NextProject };
};

type NextProject = { name: string; slug: string; image: string };

export const projects: Project[] = [
  {
    slug: "roofnest",
    name: "Roofnest",
    titleArt: { glyphs: "roofnest", x: 64.06, y: 100.57 },
    facts: [
      { label: "Industry", value: ["Roofing"] },
      { label: "Services", value: ["Web design", "Web Development", "Front-end / Back-end"] },
      { label: "Location", value: ["France"] },
    ],
    website: { label: "Roofnest", href: "https://example.com" },
    hero: "/images/project/hero.webp",
    overview: {
      lead: "Hello, and welcome to",
      body: " my profile! I am Rakib Khan, an experienced UI/UX designer with a deep passion for creating seamless and engaging digital experiences. I have multiple skills, experience in graphic design, UIUX design, IT support. I specialize in designing intuitive and visually appealing interfaces that increase user satisfaction and improve digital interactions.",
    },
    gallery: [
      "/images/project/overview-1.webp",
      "/images/project/overview-2.webp",
      "/images/project/overview-3.webp",
      "/images/project/overview-3.webp",
    ],
    process: {
      body: "In partnership with The Global Citizen Academy and the Harvard Undergraduate Global Education Movement, the HUGEM Innovation Challenge Southeast Asia IV brings together delegates from across South East Asia and esteemed speakers for a 3-day conference in Singapore. This year, guided by the Sustainable Development Goals 11 — Sustainable Cities & Communities and 12 — Responsible Consumption & Production, we aspire to help our brightest-mind delegates think deeply about these global challenges and offer solutions on how young people may collaborate to foster a sustainable international development.",
      images: ["/images/project/process-1.webp", "/images/project/process-2.webp", "/images/project/process-3.webp"],
    },
    fullPreview: "/images/project/full-preview.webp",
    next: {
      large: { name: "alqua", slug: "roofnest", image: "/images/project/next-alqua.webp" },
      small: { name: "Forplay", slug: "roofnest", image: "/images/project/next-forplay.webp" },
    },
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

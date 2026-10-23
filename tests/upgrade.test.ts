import { describe, expect, it } from "vitest";
import { defaultFaqs, defaultPages, defaultProfile, defaultServices, defaultSettings } from "@/data/defaults";
import { markdownHeadings } from "@/lib/markdown";
import { HOME_SECTIONS } from "@/lib/constants";
import { completeHomeSections } from "@/lib/db/serialize";
import {
  faqSchema,
  pageSchema,
  profileSchema,
  seoSettingsSchema,
  serviceSchema,
  siteSettingsSchema,
  testimonialSchema,
} from "@/lib/validation/content";
import { omit } from "@/lib/utils";

describe("homepage sections", () => {
  it("inserts sections added later next to their natural neighbours, keeping the saved order", () => {
    const saved = ["hero", "about", "experience", "education", "projects", "blog", "contact"].map((key) => ({ key, visible: true })) as {
      key: (typeof HOME_SECTIONS)[number];
      visible: boolean;
    }[];
    const result = completeHomeSections(saved).map((section) => section.key);
    expect(result).toEqual([
      "hero",
      "highlights",
      "services",
      "about",
      "experience",
      "process",
      "testimonials",
      "education",
      "projects",
      "blog",
      "faq",
      "contact",
    ]);
  });

  it("keeps hidden sections hidden and drops duplicates or unknown keys", () => {
    const result = completeHomeSections([
      { key: "projects", visible: false },
      { key: "projects", visible: true },
      { key: "bogus" as never, visible: true },
    ]);
    expect(result.filter((section) => section.key === "projects")).toEqual([{ key: "projects", visible: false }]);
    expect(result).toHaveLength(HOME_SECTIONS.length);
  });
});

describe("markdown headings", () => {
  it("extracts ## and ### headings with unique ids, ignoring code blocks", () => {
    const headings = markdownHeadings("## Intro\ntext\n### Setup **fast**\n```\n## not a heading\n```\n## Intro\n#### too deep");
    expect(headings).toEqual([
      { level: 2, text: "Intro", id: "intro" },
      { level: 3, text: "Setup fast", id: "setup-fast" },
      { level: 2, text: "Intro", id: "intro-1" },
    ]);
  });
});

describe("new content schemas", () => {
  it("accepts every default service, FAQ, page, profile and settings value", () => {
    for (const service of defaultServices) expect(serviceSchema.safeParse(omit(service, ["id"])).success, service.title).toBe(true);
    for (const faq of defaultFaqs) expect(faqSchema.safeParse(omit(faq, ["id"])).success, faq.question).toBe(true);
    for (const page of defaultPages) {
      expect(pageSchema.safeParse(omit(page, ["id", "publishedAt", "createdAt", "updatedAt"])).success, page.slug).toBe(true);
    }
    expect(profileSchema.safeParse({ ...defaultProfile, cv: { url: defaultProfile.cv.url, fileName: defaultProfile.cv.fileName } }).success).toBe(true);
    expect(siteSettingsSchema.safeParse(defaultSettings).success).toBe(true);
    expect(seoSettingsSchema.safeParse({ seo: defaultSettings.seo, pages: defaultSettings.pages }).success).toBe(true);
  });

  it("refuses custom page slugs that belong to built-in routes", () => {
    const page = { title: "About me", slug: "about", intro: "", content: "", status: "draft", showInFooter: true, seo: { title: "", description: "", ogImage: "", noIndex: false } };
    expect(pageSchema.safeParse(page).success).toBe(false);
    expect(pageSchema.safeParse({ ...page, slug: "admin" }).success).toBe(false);
    expect(pageSchema.safeParse({ ...page, slug: "uses" }).success).toBe(true);
  });

  it("requires at least one FAQ placement and validates testimonial ratings", () => {
    expect(faqSchema.safeParse({ question: "Is this a question?", answer: "Yes.", placements: [], order: 0, status: "active" }).success).toBe(false);
    const testimonial = {
      name: "Jane Doe",
      role: "",
      company: "",
      avatar: { url: "", alt: "" },
      quote: "Great collaborator, shipped on time.",
      rating: 5,
      sourceUrl: "",
      projectSlug: "",
      featured: true,
      order: 0,
      status: "active",
    };
    expect(testimonialSchema.safeParse(testimonial).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...testimonial, rating: 6 }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...testimonial, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

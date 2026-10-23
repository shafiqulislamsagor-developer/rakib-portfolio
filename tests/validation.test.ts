import { describe, expect, it } from "vitest";
import { safeHref, slugify, slugSchema } from "@/lib/validation/common";
import { experienceSchema, postSchema, projectSchema, siteSettingsSchema } from "@/lib/validation/content";
import { passwordChangeSchema } from "@/lib/validation/admin";
import mailFormSchema from "@/lib/validation/mail-form";
import { defaultProjects, defaultSettings } from "@/data/defaults";
import { toSettings, withDefaults } from "@/lib/db/serialize";
import { jsonLd } from "@/lib/format";

const seo = { title: "", description: "", ogImage: "", noIndex: false };

describe("link safety", () => {
  it.each(["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html;base64,xx", "//evil.example", "vbscript:x"])(
    "rejects %s",
    (href) => expect(safeHref.safeParse(href).success).toBe(false)
  );

  it.each(["", "https://example.com", "/projects", "#contact", "mailto:me@example.com", "tel:+8801"])(
    "accepts %s",
    (href) => expect(safeHref.safeParse(href).success).toBe(true)
  );
});

describe("slugs", () => {
  it("slugifies titles", () => {
    expect(slugify("Hello, World! Ünïcödé Café")).toBe("hello-world-unicode-cafe");
  });

  it("validates slug format", () => {
    expect(slugSchema.safeParse("valid-slug-1").success).toBe(true);
    expect(slugSchema.safeParse("Bad Slug").success).toBe(false);
    expect(slugSchema.safeParse("double--hyphen").success).toBe(false);
  });
});

describe("content schemas", () => {
  it("accepts every seeded project", () => {
    for (const project of defaultProjects) {
      const result = projectSchema.safeParse(project);
      expect(result.success, project.slug).toBe(true);
    }
  });

  it("rejects project links with unsafe schemes", () => {
    const result = projectSchema.safeParse({ ...defaultProjects[0], liveUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("requires a publish date for scheduled posts", () => {
    const base = {
      title: "Post",
      slug: "post",
      excerpt: "",
      content: "A long enough body for publishing purposes.",
      coverImage: { url: "", alt: "" },
      category: "",
      tags: [],
      publishAt: "",
      seo,
    };
    expect(postSchema.safeParse({ ...base, status: "scheduled" }).success).toBe(false);
    expect(postSchema.safeParse({ ...base, status: "scheduled", publishAt: "2030-01-01T10:00:00.000Z" }).success).toBe(true);
    expect(postSchema.safeParse({ ...base, status: "published", content: "short" }).success).toBe(false);
    expect(postSchema.safeParse({ ...base, status: "draft", content: "" }).success).toBe(true);
  });

  it("rejects experience that ends before it starts", () => {
    const result = experienceSchema.safeParse({
      type: "work",
      title: "Engineer",
      company: "Acme",
      companyUrl: "",
      location: "",
      startDate: "2025-05",
      endDate: "2024-01",
      description: "",
      achievements: [],
      progression: [],
      technologies: [],
      order: 0,
      status: "active",
    });
    expect(result.success).toBe(false);
  });

  it("accepts the default site settings and rejects duplicate home sections", () => {
    expect(siteSettingsSchema.safeParse(defaultSettings).success).toBe(true);
    const duplicated = { ...defaultSettings, homeSections: [...defaultSettings.homeSections, { key: "hero", visible: true }] };
    expect(siteSettingsSchema.safeParse(duplicated).success).toBe(false);
  });

  it("enforces the admin password policy", () => {
    const parse = (newPassword: string) =>
      passwordChangeSchema.safeParse({ currentPassword: "old-password-1", newPassword, confirmPassword: newPassword });
    expect(parse("short1").success).toBe(false);
    expect(parse("onlyletterslongenough").success).toBe(false);
    expect(parse("letters-and-numbers-123").success).toBe(true);
  });

  it("validates contact submissions and the honeypot", () => {
    const valid = { name: "Jane", email: "jane@example.com", subject: "Project", message: "Hello there, a real message." };
    expect(mailFormSchema.safeParse(valid).success).toBe(true);
    expect(mailFormSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
    expect(mailFormSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("JSON-LD serialisation", () => {
  it("cannot break out of the script tag", () => {
    const output = jsonLd({ name: "</script><script>alert(1)</script>", note: "line sep" });
    expect(output).not.toContain("</script>");
    expect(output).not.toContain("<");
    expect(JSON.parse(output).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("settings defaults", () => {
  it("fills missing fields but keeps explicit empty values", () => {
    const merged = withDefaults({ a: "x", b: { c: "y", d: "z" } }, { b: { c: "" } });
    expect(merged).toEqual({ a: "x", b: { c: "", d: "z" } });
  });

  it("adds home sections introduced after a document was saved", () => {
    const settings = toSettings({ homeSections: [{ key: "projects", visible: false }] });
    expect(settings.homeSections[0]).toEqual({ key: "hero", visible: true });
    expect(settings.homeSections.find((section) => section.key === "projects")).toEqual({ key: "projects", visible: false });
    expect(settings.homeSections.map((section) => section.key)).toContain("blog");
  });
});

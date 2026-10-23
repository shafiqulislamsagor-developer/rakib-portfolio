import { beforeAll, describe, expect, it } from "vitest";
import { incrementMetric, normalizeReferrer, recordPageView } from "@/lib/analytics/track";
import { metricSeries, metricTotals, topKeys } from "@/lib/analytics/report";
import { addDays, bucketKey, dayKey, resolveRange } from "@/lib/analytics/days";
import { connectDB } from "@/lib/db/connect";
import { AnalyticsDaily, Media, Message, Post, Profile, Project, Skill, VisitorMark } from "@/lib/db/models";
import { CONTACT_LIMITS, spamScore, submitContactMessage } from "@/lib/services/messages";
import { applyOrder, findMediaUsage, findSlugConflict, moveInOrder, nextPreviousSlugs, uniqueCopySlug } from "@/lib/services/content";
import { imageDimensions, mediaFileName, mediaStorageUsage, sniffMimeType, validateUpload, UploadError } from "@/lib/storage";
import { rateLimit } from "@/lib/security/rate-limit";

const context = {
  ip: "198.51.100.20",
  userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130",
  country: "BD",
  formEnabled: true,
};
const validMessage = {
  name: "Jane Client",
  email: "jane@example.com",
  subject: "New dashboard project",
  message: "Hi, we would like to build an analytics dashboard with you.",
  startedAt: Date.now() - 60_000,
};

beforeAll(async () => {
  await connectDB();
});

describe("rate limiter", () => {
  it("allows up to the limit, then blocks until the window resets", async () => {
    const key = `test:${Math.random()}`;
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await rateLimit(key, 3, 60_000));
    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
  });

  it("resets after the window expires", async () => {
    const key = `test:${Math.random()}`;
    await rateLimit(key, 1, 1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect((await rateLimit(key, 1, 60_000)).allowed).toBe(true);
  });
});

describe("contact submissions", () => {
  it("stores the message in the inbox as unread and awaiting reply", async () => {
    const result = await submitContactMessage(validMessage, { ...context, ip: "10.1.0.1" });
    expect(result).toEqual({ success: true });
    const stored = await Message.findOne({ email: "jane@example.com" }).lean();
    expect(stored?.status).toBe("pending");
    expect(stored?.read).toBe(false);
    expect(stored?.replies).toEqual([]);
    expect(stored?.meta?.country).toBe("BD");
    expect(stored?.meta?.ipHash).not.toContain("10.1.0.1");
  });

  it("stores markup as plain text (rendered escaped in the admin)", async () => {
    await submitContactMessage(
      { ...validMessage, email: "xss@example.com", subject: "<script>alert(1)</script>", message: "<img src=x onerror=alert(1)> hello there" },
      { ...context, ip: "10.1.0.4" }
    );
    expect((await Message.findOne({ email: "xss@example.com" }).lean())?.subject).toBe("<script>alert(1)</script>");
  });

  it("silently drops honeypot submissions", async () => {
    const before = await Message.countDocuments();
    const result = await submitContactMessage({ ...validMessage, website: "http://spam.example" }, { ...context, ip: "10.1.0.5" });
    expect(result.success).toBe(true);
    expect(await Message.countDocuments()).toBe(before);
  });

  it("files instant or link-stuffed submissions as spam", async () => {
    await submitContactMessage({ ...validMessage, email: "bot@example.com", startedAt: Date.now() }, { ...context, ip: "10.1.0.6" });
    expect((await Message.findOne({ email: "bot@example.com" }).lean())?.status).toBe("spam");
    expect(spamScore({ name: "x", subject: "y", message: "http://a http://b http://c http://d" })).toBeGreaterThanOrEqual(4);
  });

  it("rate limits repeated submissions from one IP", async () => {
    const ip = "10.9.9.9";
    const results = [];
    for (let i = 0; i <= CONTACT_LIMITS.perIp.limit; i += 1) {
      results.push(await submitContactMessage({ ...validMessage, email: `user${i}@example.com` }, { ...context, ip }));
    }
    expect(results.at(-1)).toEqual({ success: false, error: expect.stringMatching(/too many/i) });
  });

  it("rejects invalid input and respects a closed form", async () => {
    expect((await submitContactMessage({ ...validMessage, email: "nope" }, context)).success).toBe(false);
    expect((await submitContactMessage(validMessage, { ...context, formEnabled: false, ip: "10.1.0.7" })).success).toBe(false);
  });
});

describe("first-party analytics", () => {
  beforeAll(async () => {
    await Project.create({ title: "Tracked", slug: "tracked-project", summary: "A tracked project summary", status: "published" });
    await Project.create({ title: "Hidden", slug: "draft-project", summary: "Draft project summary", status: "draft" });
  });

  const view = (path: string, extra: Partial<Parameters<typeof recordPageView>[0]> = {}) =>
    recordPageView({ path, referrer: "", landing: false, ip: "203.0.113.5", userAgent: "UA-1", country: "BD", ownHost: "example.com", ...extra });

  it("counts page views, daily unique visitors and countries once per visitor", async () => {
    await view("/", { landing: true, referrer: "https://www.google.com/search?q=x" });
    await view("/projects");
    await view("/", { ip: "203.0.113.6", country: "US", landing: true });
    const today = dayKey();
    const totals = await metricTotals(["pageview", "visitor"], today, today);
    expect(totals).toEqual({ pageview: 3, visitor: 2 });
    expect(await topKeys("country", today, today)).toEqual([
      { key: "BD", value: 1 },
      { key: "US", value: 1 },
    ]);
    expect(await topKeys("referrer", today, today)).toEqual([
      { key: "(direct)", value: 1 },
      { key: "google.com", value: 1 },
    ]);
    expect((await VisitorMark.findOne({}).lean())?.hash).not.toContain("203.0.113");
  });

  it("counts project views only for published projects", async () => {
    expect((await view("/projects/tracked-project")).recorded).toBe(true);
    expect((await view("/projects/draft-project")).recorded).toBe(false);
    expect((await view("/projects/does-not-exist")).recorded).toBe(false);
    expect((await Project.findOne({ slug: "tracked-project" }).lean())?.viewCount).toBe(1);
  });

  it("ignores unknown or malicious paths", async () => {
    const before = await AnalyticsDaily.countDocuments();
    expect((await view("/admin")).recorded).toBe(false);
    expect((await view("/wp-login.php")).recorded).toBe(false);
    expect((await view("/projects/../admin")).recorded).toBe(false);
    expect(await AnalyticsDaily.countDocuments()).toBe(before);
  });

  it("ignores internal referrers", () => {
    expect(normalizeReferrer("https://example.com/projects", "example.com")).toBeNull();
    expect(normalizeReferrer("https://www.example.com/", "example.com")).toBeNull();
    expect(normalizeReferrer("", "example.com")).toBe("(direct)");
    expect(normalizeReferrer("https://t.co/abc", "example.com")).toBe("t.co");
  });

  it("builds zero-filled series and weekly buckets", async () => {
    const today = dayKey();
    await incrementMetric("cv_download", "", 2, addDays(today, -2));
    const series = await metricSeries(["cv_download"], addDays(today, -3), today, "day");
    expect(series).toHaveLength(4);
    expect(series.map((point) => (point as Record<string, unknown>).cv_download)).toEqual([0, 2, 0, 0]);
    expect(bucketKey("2026-10-15", "week")).toBe("2026-10-12");
    expect(bucketKey("2026-10-15", "month")).toBe("2026-10");
  });

  it("resolves ranges safely", () => {
    expect(resolveRange({ range: "7d" }).days).toBe(7);
    expect(resolveRange({ range: "bogus" }).preset).toBe("30d");
    expect(resolveRange({ from: "2026-02-01", to: "2026-01-01" }).preset).toBe("30d");
    expect(resolveRange({ from: "2020-01-01", to: "2026-01-01" }).days).toBeLessThanOrEqual(731);
  });
});

describe("content helpers", () => {
  it("detects slug conflicts, including redirect sources", async () => {
    const a = await Project.create({ title: "A", slug: "alpha", summary: "Alpha summary text", previousSlugs: ["old-alpha"] });
    expect(await findSlugConflict(Project, "alpha")).not.toBeNull();
    expect(await findSlugConflict(Project, "old-alpha")).not.toBeNull();
    expect(await findSlugConflict(Project, "alpha", a._id.toString())).toBeNull();
    expect(await findSlugConflict(Project, "fresh-slug")).toBeNull();
    expect(await uniqueCopySlug(Project, "alpha")).toBe("alpha-copy");
  });

  it("keeps old slugs as redirects and never redirects a slug to itself", () => {
    expect(nextPreviousSlugs({ slug: "new-a", previousSlugs: ["old"] }, "newer")).toEqual(["old", "new-a"]);
    expect(nextPreviousSlugs({ slug: "b", previousSlugs: ["a"] }, "a")).toEqual(["b"]);
  });

  it("reorders items and normalises duplicate order values", async () => {
    const names = ["One", "Two", "Three"];
    const docs = await Skill.insertMany(names.map((name) => ({ name, category: "Test", order: 5 })));
    await moveInOrder(Skill, docs[2]._id.toString(), "up");
    const ordered = await Skill.find({ category: "Test" }).sort({ order: 1 }).lean();
    expect(ordered.map((skill) => skill.name)).toEqual(["One", "Three", "Two"]);
    expect(ordered.map((skill) => skill.order)).toEqual([0, 1, 2]);
    expect(await moveInOrder(Skill, ordered[0]._id.toString(), "up")).toBe(false);
  });

  it("saves a drag-and-drop order for a slice without moving the rest", async () => {
    const docs = await Skill.insertMany(["A", "B", "C", "D", "E"].map((name, order) => ({ name, category: "Drag", order })));
    const id = (name: string) => docs.find((doc) => doc.name === name)!._id.toString();
    // The admin sees only B, D, E (e.g. a filtered tab) and drags E to the top.
    expect(await applyOrder(Skill, [id("E"), id("B"), id("D")], { category: "Drag" })).toBe(true);
    const names = async () => (await Skill.find({ category: "Drag" }).sort({ order: 1 }).lean()).map((skill) => skill.name);
    expect(await names()).toEqual(["A", "E", "C", "B", "D"]);
    // Stale or duplicated lists are rejected instead of corrupting the order.
    expect(await applyOrder(Skill, [id("E"), id("E")], { category: "Drag" })).toBe(false);
    expect(await applyOrder(Skill, [id("A"), "6acb172c590e76d1b638354f"], { category: "Drag" })).toBe(false);
    expect(await names()).toEqual(["A", "E", "C", "B", "D"]);
  });

  it("finds where a media URL is used and whether that content is live", async () => {
    const url = "/media/6acb172c590e76d1b638354f/project-cover.png";
    await Project.create({ title: "Live", slug: "live-media", summary: "Uses media summary", status: "published", cover: { url, alt: "" } });
    await Post.create({ title: "Draft", slug: "draft-media", status: "draft", content: `Look: ![x](${url})` });
    await Profile.updateOne({ key: "main" }, { $set: { "avatar.url": url } }, { upsert: true });
    const usage = await findMediaUsage(url);
    expect(usage.map((item) => [item.type, item.published])).toEqual([
      ["Project", true],
      ["Blog post", false],
      ["Profile", true],
    ]);
    expect(await findMediaUsage("https://example.com/unused.png")).toEqual([]);
  });
});

describe("file storage in MongoDB", () => {
  it("stores bytes outside normal queries and reports usage", async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 3]);
    const media = await Media.create({ url: "/media/test/pixel.png", data: bytes, mimeType: "image/png", bytes: bytes.length });
    const listed = await Media.findById(media._id).lean();
    expect(listed).not.toHaveProperty("data");
    const full = await Media.findById(media._id).select("+data");
    expect(Buffer.compare(full!.data, bytes)).toBe(0);
    expect((await mediaStorageUsage()).bytes).toBeGreaterThanOrEqual(bytes.length);
  });

  it("builds safe file names and reads image dimensions from headers", () => {
    expect(mediaFileName("My Résumé (final).PDF", "application/pdf")).toBe("my-resume-final.pdf");
    expect(mediaFileName("../../etc/passwd", "image/png")).toBe("etc-passwd.png");
    const png = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
    png.writeUInt32BE(640, 16);
    png.writeUInt32BE(480, 20);
    expect(imageDimensions(png, "image/png")).toEqual({ width: 640, height: 480 });
    const gif = Buffer.concat([Buffer.from("GIF89a", "latin1"), Buffer.from([32, 0, 16, 0])]);
    expect(imageDimensions(Buffer.concat([gif, Buffer.alloc(8)]), "image/gif")).toEqual({ width: 32, height: 16 });
  });
});

describe("upload validation", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
  const pdf = Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj");
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

  it("identifies files by content, not extension", () => {
    expect(sniffMimeType(png)).toBe("image/png");
    expect(sniffMimeType(pdf)).toBe("application/pdf");
    expect(sniffMimeType(svg)).toBeNull();
    expect(sniffMimeType(Buffer.from("MZ\x90\x00 executable payload"))).toBeNull();
  });

  it("enforces type and size rules", () => {
    expect(validateUpload(png, "image")).toBe("image/png");
    expect(() => validateUpload(pdf, "image")).toThrow(UploadError);
    expect(() => validateUpload(svg, "any")).toThrow(UploadError);
    expect(() => validateUpload(Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]), "image")).toThrow(/4 MB/);
    expect(() => validateUpload(Buffer.alloc(0), "image")).toThrow(/empty/);
  });
});

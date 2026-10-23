import { beforeAll, describe, expect, it } from "vitest";
import { csvBody, csvCell } from "@/lib/admin/csv";
import {
  backfillVisitorFacts,
  purgeVisitorLog,
  resolveVisitorQuery,
  visitorChannelCounts,
  visitorStats,
} from "@/lib/admin/visitors";
import { classifySource } from "@/lib/analytics/source";
import { STATUS_FILTERS, visitorStatus, type VisitorStatusInput } from "@/lib/analytics/status";
import { recordVisitorEvent, type TrackRequest } from "@/lib/analytics/visitors";
import { VISITOR_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Visitor, VisitorEvent } from "@/lib/db/models";
import { trackPayloadSchema, type TrackPayload } from "@/lib/validation/tracking";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

describe("traffic source", () => {
  it("names search engines, AI assistants, social networks and plain referrals", () => {
    expect(classifySource({ referrer: "https://www.google.com/search?q=web+developer" })).toEqual({ channel: "organic", name: "Google" });
    expect(classifySource({ referrer: "https://www.google.co.uk/" })).toEqual({ channel: "organic", name: "Google" });
    // An AI assistant on a search engine's own domain must not read as search.
    expect(classifySource({ referrer: "https://gemini.google.com/app" })).toEqual({ channel: "ai", name: "Gemini" });
    expect(classifySource({ referrer: "https://chatgpt.com/" })).toEqual({ channel: "ai", name: "ChatGPT" });
    expect(classifySource({ referrer: "https://www.linkedin.com/feed/" })).toEqual({ channel: "social", name: "LinkedIn" });
    expect(classifySource({ referrer: "https://t.co/aBcDeF" })).toEqual({ channel: "social", name: "X (Twitter)" });
    expect(classifySource({ referrer: "https://dev.to/someone/a-post" })).toEqual({ channel: "referral", name: "dev.to" });
    expect(classifySource({})).toEqual({ channel: "direct", name: "" });
  });

  it("prefers UTM tags over the referrer", () => {
    expect(classifySource({ referrer: "https://www.facebook.com/", utm: { source: "facebook", medium: "cpc", campaign: "spring" } })).toEqual({
      channel: "campaign",
      name: "facebook",
    });
    expect(classifySource({ utm: { source: "newsletter", medium: "email" } })).toEqual({ channel: "email", name: "newsletter" });
    // A bare utm_source alongside a known referrer keeps that referrer's channel.
    expect(classifySource({ referrer: "https://www.google.com/", utm: { source: "google" } })).toEqual({ channel: "organic", name: "google" });
  });

  it("falls back to the in-app browser, and never counts its own site as a referral", () => {
    expect(classifySource({ inApp: "Instagram" })).toEqual({ channel: "social", name: "Instagram" });
    expect(classifySource({ referrer: "https://sagor.dev/projects", ownHost: "www.sagor.dev" })).toEqual({ channel: "direct", name: "" });
    expect(classifySource({ referrer: "not a url" })).toEqual({ channel: "direct", name: "" });
    expect(classifySource({ referrer: "javascript:alert(1)" })).toEqual({ channel: "direct", name: "" });
  });
});

describe("visitor status", () => {
  beforeAll(async () => {
    await connectDB();
  });

  const seeds: (VisitorStatusInput & { vid: string })[] = [
    { vid: "status-new-1", sessions: 1 },
    { vid: "status-new-2", sessions: 0 },
    { vid: "status-returning-1", sessions: 4 },
    { vid: "status-lead-1", sessions: 1, contact: { at: new Date() } },
    { vid: "status-lead-2", sessions: 6, contact: { at: new Date() } },
    // Tapped WhatsApp (or phone / email) without sending the form: still a lead.
    { vid: "status-lead-3", sessions: 1, reachedOutAt: new Date() },
    { vid: "status-customer-1", sessions: 9, customer: true, contact: { at: new Date() } },
  ];

  it("labels a visitor, and the database filters pick out exactly the same people", async () => {
    await Visitor.insertMany(seeds.map((seed) => ({ ...seed, contact: seed.contact ?? undefined })));
    expect(seeds.map(visitorStatus)).toEqual(["new", "new", "returning", "lead", "lead", "lead", "customer"]);

    for (const status of VISITOR_STATUSES) {
      const expected = seeds.filter((seed) => visitorStatus(seed) === status).map((seed) => seed.vid);
      const found = await Visitor.find({ $and: [{ vid: /^status-/ }, STATUS_FILTERS[status]] }).select("vid").lean();
      expect(found.map((visitor) => visitor.vid).sort()).toEqual(expected.sort());
    }
  });
});

describe("dashboard queries", () => {
  beforeAll(async () => {
    await connectDB();
  });

  it("falls back to safe defaults for anything it does not recognise", () => {
    const query = resolveVisitorQuery({ view: "nope", device: "<script>", source: "", sort: "lastSeenAt; drop" });
    expect(query).toMatchObject({ view: "all", status: "", device: "", source: "", q: "", sortKey: "recent", filtered: false });
    expect(query.sort).toEqual({ lastSeenAt: -1 });
    expect(query.filter).toEqual(query.period);
  });

  it("combines the date range with the status, device, source and search filters", () => {
    const query = resolveVisitorQuery({ view: "lead", device: "mobile", source: "social", q: "  Rahim  ", sort: "visits", range: "7d" });
    expect(query).toMatchObject({ view: "lead", status: "lead", device: "mobile", source: "social", q: "Rahim", sortKey: "visits", filtered: true });
    expect(query.range.days).toBe(7);
    expect(query.sort).toEqual({ sessions: -1, lastSeenAt: -1 });
    // range + status + device + source + search
    expect((query.filter as { $and: unknown[] }).$and).toHaveLength(5);
  });

  it("counts visitors, visits, statuses and channels for the period", async () => {
    const request: TrackRequest = {
      ip: "203.0.113.10",
      userAgent: CHROME,
      geo: { country: "BD", region: "C", city: "Dhaka", latitude: "23.81", longitude: "90.41" },
      ownHost: "sagor.dev",
    };
    const record = (payload: Record<string, unknown>) =>
      recordVisitorEvent(trackPayloadSchema.parse(payload) as TrackPayload, request);

    const a = { vid: "stats-a-1", sid: "stats-a-s1", pid: "stats-a-p1" };
    await record({ type: "pageview", path: "/", ...a, landing: true, newSession: true, referrer: "https://www.linkedin.com/feed/", client: {} });
    await record({ type: "engage", path: "/", ...a, duration: 30, depth: 40, sections: [] });
    await record({ type: "engage", path: "/", ...a, duration: 50, depth: 60, sections: [] });
    await record({ type: "pageview", path: "/projects", vid: a.vid, sid: "stats-a-s2", pid: "stats-a-p2", newSession: true, client: {} });
    await record({ type: "pageview", path: "/contact", vid: "stats-b-1", sid: "stats-b-s1", pid: "stats-b-p1", landing: true, newSession: true, client: {} });

    // Engagement beacons repeat a growing total; the visitor's seconds must not count the overlap twice.
    expect(await Visitor.findOne({ vid: a.vid }).lean()).toMatchObject({
      source: { channel: "social", name: "LinkedIn" },
      seconds: 50,
      sessions: 2,
      pageviews: 2,
    });
    expect(await Visitor.findOne({ vid: "stats-b-1" }).lean()).toMatchObject({ source: { channel: "direct", name: "" } });

    const query = resolveVisitorQuery({ range: "30d" });
    const mine = { $and: [query.period, { vid: /^stats-/ }] };
    const stats = await visitorStats(mine, query.activeSince);
    expect(stats).toMatchObject({ visitors: 2, sessions: 3, pageviews: 3, seconds: 50, active: 2, new: 1, returning: 1, lead: 0, customer: 0 });
    expect(await visitorChannelCounts(mine)).toEqual({ social: 1, direct: 1 });

    // Tapping the WhatsApp link turns that same visitor into a lead, with no form involved.
    await record({
      type: "outbound",
      path: "/contact",
      vid: "stats-b-1",
      sid: "stats-b-s1",
      pid: "stats-b-p1",
      label: "WhatsApp",
      href: "https://wa.me/8801712345678",
    });
    expect(await Visitor.findOne({ vid: "stats-b-1" }).lean()).toMatchObject({ reachedOutAt: expect.any(Date) });
    expect(await visitorStats(mine, query.activeSince)).toMatchObject({ lead: 1, new: 0 });

    // An ordinary outbound link is not a contact attempt.
    await record({
      type: "outbound",
      path: "/projects",
      vid: "stats-a-1",
      sid: "stats-a-s2",
      pid: "stats-a-p2",
      label: "GitHub",
      href: "https://github.com/someone/repo",
    });
    expect(await Visitor.findOne({ vid: "stats-a-1" }).lean()).toMatchObject({ reachedOutAt: null });
  });
});

describe("retention", () => {
  beforeAll(async () => {
    await connectDB();
  });

  it("deletes visitors and events past the chosen retention window", async () => {
    const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    await Visitor.create({ vid: "purge-old-1", firstSeenAt: old, lastSeenAt: old });
    await VisitorEvent.create({ vid: "purge-old-1", type: "pageview", path: "/", createdAt: old });

    const result = await purgeVisitorLog(90);
    expect(result.visitors).toBeGreaterThanOrEqual(1);
    expect(await Visitor.countDocuments({ vid: "purge-old-1" })).toBe(0);
    expect(await VisitorEvent.countDocuments({ vid: "purge-old-1" })).toBe(0);
    // Recent visitors are untouched.
    expect(await Visitor.countDocuments({ vid: "stats-a-1" })).toBe(1);
  });

  it("fills in the source and time on site for records saved before those were kept", async () => {
    // insertOne skips Mongoose defaults, so this is the shape an older release wrote.
    await Visitor.collection.insertOne({
      vid: "legacy-1",
      firstReferrer: "https://www.google.com/",
      ips: [],
      sessions: 1,
      pageviews: 1,
      actions: 0,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });
    await VisitorEvent.create({ vid: "legacy-1", type: "pageview", path: "/", duration: 75 });

    expect(await backfillVisitorFacts(null)).toBeGreaterThanOrEqual(1);
    expect(await Visitor.findOne({ vid: "legacy-1" }).lean()).toMatchObject({
      source: { channel: "organic", name: "Google" },
      seconds: 75,
    });
    // Nothing left to do on a second pass.
    expect(await backfillVisitorFacts(null)).toBe(0);
  });
});

describe("csv export", () => {
  it("quotes every field and defuses spreadsheet formulas", () => {
    expect(csvCell("Dhaka, Bangladesh")).toBe('"Dhaka, Bangladesh"');
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvCell('=HYPERLINK("http://evil","click")')).toBe('"\'=HYPERLINK(""http://evil"",""click"")"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
    // Coordinates stay numbers rather than being quoted into text.
    expect(csvCell("-23.81")).toBe('"-23.81"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(12)).toBe('"12"');
    expect(csvBody(["day", "visits"], [["2026-10-15", 3]])).toBe('"day","visits"\r\n"2026-10-15","3"');
  });
});

import { beforeAll, describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/analytics/user-agent";
import { deleteVisitorLog, recordVisitorEvent, type TrackRequest } from "@/lib/analytics/visitors";
import { connectDB } from "@/lib/db/connect";
import { Message, Visitor, VisitorEvent } from "@/lib/db/models";
import { getGeo } from "@/lib/security/request";
import { submitContactMessage } from "@/lib/services/messages";
import mailFormSchema from "@/lib/validation/mail-form";
import { trackPayloadSchema, type TrackPayload } from "@/lib/validation/tracking";

const UA = {
  windowsChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  samsungInternet:
    "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  reducedAndroid: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  realmeWebView:
    "Mozilla/5.0 (Linux; Android 12; RMX3363 Build/RKQ1.211119.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/445.0.0.34.118;]",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  instagramIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.15.103 (iPhone14,2; iOS 16_6; en_US; en; scale=3.00; 1170x2532; 515056108)",
  firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
};

describe("user agent parsing", () => {
  it("names desktop browsers and tells Windows 11 apart with client hints", () => {
    expect(parseUserAgent(UA.windowsChrome)).toMatchObject({ browser: "Chrome", browserVersion: "129", os: "Windows", osVersion: "10", deviceType: "desktop", deviceName: "Windows PC" });
    expect(parseUserAgent(UA.windowsChrome, { platform: "Windows", platformVersion: "15.0.0" }).osVersion).toBe("11");
    expect(parseUserAgent(UA.macSafari)).toMatchObject({ browser: "Safari", os: "macOS", deviceName: "Apple Mac" });
    // iPad in desktop mode reports a Mac user agent but has a touch screen.
    expect(parseUserAgent(UA.macSafari, { touchPoints: 5 })).toMatchObject({ os: "iPadOS", deviceType: "tablet", deviceName: "Apple iPad" });
  });

  it("finds phone makers and models", () => {
    expect(parseUserAgent(UA.iphoneSafari)).toMatchObject({ os: "iOS", osVersion: "17.5", deviceType: "mobile", deviceName: "Apple iPhone" });
    expect(parseUserAgent(UA.samsungInternet)).toMatchObject({ browser: "Samsung Internet", deviceVendor: "Samsung", deviceModel: "SM-A536E", deviceName: "Samsung SM-A536E" });
    expect(parseUserAgent(UA.realmeWebView)).toMatchObject({ deviceName: "Realme RMX3363", inApp: "Facebook", osVersion: "12" });
    expect(parseUserAgent(UA.instagramIphone)).toMatchObject({ deviceModel: "iPhone14,2", inApp: "Instagram" });
  });

  it("uses client hints when the user agent hides the model", () => {
    expect(parseUserAgent(UA.reducedAndroid)).toMatchObject({ deviceModel: "", deviceName: "Android phone" });
    expect(parseUserAgent(UA.reducedAndroid, { model: "Pixel 8", platform: "Android", platformVersion: "14.0.0", mobile: true })).toMatchObject({
      deviceName: "Google Pixel 8",
      osVersion: "14",
      deviceType: "mobile",
    });
    expect(parseUserAgent(UA.firefoxAndroid)).toMatchObject({ browser: "Firefox", deviceModel: "", deviceType: "mobile" });
    expect(parseUserAgent("")).toMatchObject({ deviceType: "unknown", deviceName: "Unknown device" });
  });
});

describe("tracking payloads", () => {
  const ids = { vid: "visitor-0001", sid: "session-0001", pid: "pageview-0001" };

  it("treats old untyped beacons as page views", () => {
    const parsed = trackPayloadSchema.parse({ path: "/", referrer: "", landing: true });
    expect(parsed).toMatchObject({ type: "pageview", path: "/", landing: true });
    expect(parsed.vid).toBeUndefined();
  });

  it("truncates long labels instead of dropping the event and rejects bad ids", () => {
    const parsed = trackPayloadSchema.parse({ type: "click", path: "/", ...ids, label: `  Hire   me ${"x".repeat(500)}` });
    expect(parsed.type === "click" && parsed.label.length).toBe(160);
    expect(parsed.type === "click" && parsed.label.startsWith("Hire me x")).toBe(true);
    expect(trackPayloadSchema.safeParse({ type: "click", path: "/", ...ids, vid: "<script>" }).success).toBe(false);
    expect(trackPayloadSchema.safeParse({ type: "click", path: "https://evil.example", ...ids }).success).toBe(false);
  });

  it("keeps the page view when client details are malformed", () => {
    const parsed = trackPayloadSchema.parse({ type: "pageview", path: "/", ...ids, client: { cpuCores: "lots" } });
    expect(parsed.type === "pageview" && parsed.client).toBeUndefined();
  });
});

describe("visitor log", () => {
  beforeAll(async () => {
    await connectDB();
  });

  const request: TrackRequest = {
    ip: "203.0.113.50",
    userAgent: UA.samsungInternet,
    geo: { country: "BD", region: "C", city: "Dhaka", latitude: "23.81", longitude: "90.41" },
  };
  const ids = { vid: "visitor-log-1", sid: "session-a-1", pid: "page-a-0001" };
  const record = (payload: Record<string, unknown>, overrides: Partial<TrackRequest> = {}) =>
    recordVisitorEvent(trackPayloadSchema.parse(payload) as TrackPayload, { ...request, ...overrides });

  it("stores the visitor's IP, device, location and first page view", async () => {
    await record({
      type: "pageview",
      path: "/",
      ...ids,
      landing: true,
      newSession: true,
      referrer: "https://www.linkedin.com/feed/",
      utm: { source: "linkedin" },
      client: { screen: "412x915", timezone: "Asia/Dhaka", language: "bn-BD", cpuCores: 8 },
    });
    const visitor = await Visitor.findOne({ vid: ids.vid }).lean();
    expect(visitor).toMatchObject({
      ip: "203.0.113.50",
      ips: ["203.0.113.50"],
      deviceName: "Samsung SM-A536E",
      deviceType: "mobile",
      browser: "Samsung Internet",
      city: "Dhaka",
      country: "BD",
      screen: "412x915",
      timezone: "Asia/Dhaka",
      cpuCores: 8,
      firstReferrer: "https://www.linkedin.com/feed/",
      firstLanding: "/",
      utm: { source: "linkedin", medium: "", campaign: "" },
      sessions: 1,
      pageviews: 1,
    });
    expect(await VisitorEvent.countDocuments({ vid: ids.vid, type: "pageview" })).toBe(1);
  });

  it("adds time on page, scroll depth and sections to the page view", async () => {
    await record({ type: "engage", path: "/", ...ids, duration: 40, depth: 55, sections: ["top", "projects"] });
    await record({ type: "engage", path: "/", ...ids, duration: 25, depth: 80, sections: ["projects", "contact"] });
    const view = await VisitorEvent.findOne({ vid: ids.vid, pid: ids.pid }).lean();
    expect(view).toMatchObject({ duration: 40, depth: 80 });
    expect([...(view?.sections ?? [])].sort()).toEqual(["contact", "projects", "top"]);
  });

  it("records actions with where they happened, and new IPs", async () => {
    await record(
      { type: "download", path: "/", ...ids, label: "Download CV", href: "https://example.com/cv", section: "top" },
      { ip: "198.51.100.7", geo: { country: "", region: "", city: "", latitude: "", longitude: "" } }
    );
    await record({ type: "pageview", path: "/projects", ...ids, sid: "session-b-1", pid: "page-b-0001", newSession: true, client: {} });
    const visitor = await Visitor.findOne({ vid: ids.vid }).lean();
    expect(visitor).toMatchObject({ actions: 1, pageviews: 2, sessions: 2, lastPath: "/projects", city: "Dhaka" });
    expect([...(visitor?.ips ?? [])].sort()).toEqual(["198.51.100.7", "203.0.113.50"]);
    expect(await VisitorEvent.findOne({ vid: ids.vid, type: "download" }).lean()).toMatchObject({ label: "Download CV", section: "top", ip: "198.51.100.7" });
  });

  it("ignores page views without visitor ids and deletes a visitor completely", async () => {
    expect((await record({ path: "/", referrer: "", landing: true })).recorded).toBe(false);
    expect(await deleteVisitorLog(ids.vid)).toBe(3); // two page views + one download; engagement updates the page view
    expect(await Visitor.countDocuments({ vid: ids.vid })).toBe(0);
    expect(await VisitorEvent.countDocuments({ vid: ids.vid })).toBe(0);
  });

  it("links a contact form submission (with phone and address) to the sender's visitor profile", async () => {
    const vid = "visitor-contact-1";
    await record({ type: "pageview", path: "/contact", vid, sid: "session-c-1", pid: "page-c-0001", newSession: true, client: {} });
    const result = await submitContactMessage(
      {
        name: "Rahim Uddin",
        email: "rahim@example.com",
        subject: "Website for my shop",
        message: "Hi, I need an e-commerce website for my clothing shop.",
        phone: "01712-345678",
        address: "Mirpur 10, Dhaka",
        visitorId: vid,
        startedAt: Date.now() - 60_000,
      },
      { ip: "203.0.113.80", userAgent: UA.samsungInternet, country: "BD", formEnabled: true }
    );
    expect(result.success).toBe(true);
    const message = await Message.findOne({ email: "rahim@example.com" }).lean();
    expect(message).toMatchObject({ phone: "01712-345678", address: "Mirpur 10, Dhaka", meta: { visitorId: vid } });
    const visitor = await Visitor.findOne({ vid }).lean();
    expect(visitor?.contact).toMatchObject({ name: "Rahim Uddin", email: "rahim@example.com", phone: "01712-345678", address: "Mirpur 10, Dhaka" });
    expect(String(visitor?.contact?.messageId)).toBe(String(message?._id));

    // An unknown visitor id stores the message but creates no visitor; a malformed one is dropped.
    await submitContactMessage(
      { name: "No Log", email: "nolog@example.com", subject: "Quick question", message: "Do you also build mobile apps?", visitorId: "missing-visitor-1", startedAt: Date.now() - 60_000 },
      { ip: "203.0.113.81", userAgent: "UA", country: "", formEnabled: true }
    );
    expect(await Visitor.countDocuments({ vid: "missing-visitor-1" })).toBe(0);
    const invalid = mailFormSchema.parse({ name: "Bad Id", email: "x@example.com", subject: "Hello there", message: "Just saying hello to you.", visitorId: "<bad>" });
    expect(invalid.visitorId).toBeUndefined();
    expect(mailFormSchema.safeParse({ ...invalid, phone: "call me maybe" }).success).toBe(false);
  });

  it("reads city-level location from Vercel headers", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "bd",
      "x-vercel-ip-city": "Cox%27s%20Bazar",
      "x-vercel-ip-latitude": "21.45",
      "x-vercel-ip-longitude": "not-a-number",
    });
    expect(getGeo(headers)).toEqual({ country: "BD", region: "", city: "Cox's Bazar", latitude: "21.45", longitude: "" });
  });
});

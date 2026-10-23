import { z } from "zod";

/*
 * Beacons sent by app/_components/visitor-tracker to /api/track. Free text is
 * truncated rather than rejected so one long label never drops an event.
 */

const id = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
const path = z.string().max(300).startsWith("/");
const text = (max: number) => z.string().transform((value) => value.replace(/\s+/g, " ").trim().slice(0, max));

const clientSchema = z
  .object({
    screen: text(20),
    viewport: text(20),
    pixelRatio: z.number().min(0).max(10),
    touchPoints: z.number().int().min(0).max(100),
    cpuCores: z.number().int().min(0).max(512),
    memoryGb: z.number().min(0).max(4096),
    connection: text(20),
    colorScheme: text(10),
    language: text(35),
    languages: text(120),
    timezone: text(60),
    // User-Agent Client Hints (Chromium only)
    model: text(60),
    platform: text(30),
    platformVersion: text(30),
    mobile: z.boolean(),
  })
  .partial();
export type TrackClientInfo = z.infer<typeof clientSchema>;

const pageviewSchema = z.object({
  type: z.literal("pageview"),
  path,
  referrer: z.string().max(1000).default(""),
  landing: z.boolean().default(false),
  // Missing on beacons from pages cached before the visitor log existed: those only feed the daily counters.
  vid: id.optional(),
  sid: id.optional(),
  pid: id.optional(),
  newSession: z.boolean().default(false),
  utm: z.object({ source: text(100), medium: text(100), campaign: text(100) }).partial().optional().catch(undefined),
  client: clientSchema.optional().catch(undefined),
});

/** Sent when the visitor leaves a page (or hides the tab): updates that page view. */
const engageSchema = z.object({
  type: z.literal("engage"),
  path,
  vid: id,
  sid: id,
  pid: id,
  duration: z.number().int().min(0).max(86_400),
  depth: z.number().int().min(0).max(100),
  sections: z.array(text(60)).max(30).default([]),
});

const actionSchema = z.object({
  type: z.enum(["click", "outbound", "download", "form_submit", "copy"]),
  path,
  vid: id,
  sid: id,
  pid: id,
  label: text(160).default(""),
  href: z.string().transform((value) => value.slice(0, 1000)).default(""),
  section: text(60).default(""),
});

export const trackPayloadSchema = z.preprocess(
  // Older tracker builds sent page views without a type.
  (value) => (value && typeof value === "object" && !("type" in value) ? { ...value, type: "pageview" } : value),
  z.discriminatedUnion("type", [pageviewSchema, engageSchema, actionSchema])
);
export type TrackPayload = z.infer<typeof trackPayloadSchema>;

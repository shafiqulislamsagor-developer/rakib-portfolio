import { connectDB } from "@/lib/db/connect";
import { Visitor, VisitorEvent } from "@/lib/db/models";
import type { getGeo } from "@/lib/security/request";
import type { TrackPayload } from "@/lib/validation/tracking";
import { classifySource } from "./source";
import { parseUserAgent } from "./user-agent";

/*
 * Visitor log. Unlike the daily counters in ./track, this keeps each visitor
 * (IP address, device, browser, approximate location) and every page view and
 * action they take, for the admin's Visitors page. Both collections expire a
 * year after the last activity (VISITOR_LOG_TTL_SECONDS).
 */

export type TrackRequest = {
  ip: string;
  userAgent: string;
  geo: ReturnType<typeof getGeo>;
  /** The site's own host, so an internal referrer is not mistaken for someone else's traffic. */
  ownHost?: string | null;
};

/** Links that only get tapped when someone wants to reach you. */
const CONTACT_LINK = /^(?:mailto:|tel:|https?:\/\/(?:wa\.me|(?:api|web|chat)\.whatsapp\.com|m\.me|t\.me)\/)/i;

/** Drop empty values so a request without (say) location data never erases what is stored. */
function present<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")) as Partial<T>;
}

async function upsertVisitor(vid: string, update: Record<string, unknown>) {
  try {
    await Visitor.updateOne({ vid }, update, { upsert: true });
  } catch (error) {
    // Two first events from one visitor can race on the unique vid; the retry updates the winner.
    if ((error as { code?: number }).code !== 11000) throw error;
    await Visitor.updateOne({ vid }, update);
  }
}

export async function recordVisitorEvent(event: TrackPayload, request: TrackRequest) {
  const { vid, sid, pid, path } = event;
  if (!vid || !sid || !pid) return { recorded: false as const };
  await connectDB();
  const now = new Date();
  const knownIp = request.ip !== "unknown";
  const ipUpdate = knownIp ? { $addToSet: { ips: request.ip } } : {};

  if (event.type === "engage") {
    // The page view keeps the longest reading; the visitor's total grows by whatever this beacon adds.
    const before = await VisitorEvent.findOneAndUpdate(
      { vid, pid, type: "pageview" },
      {
        $max: { duration: event.duration, depth: event.depth },
        ...(event.sections.length ? { $addToSet: { sections: { $each: event.sections } } } : {}),
      },
      { projection: { duration: 1 } }
    ).lean();
    // No page view to attach to (a lost beacon): skip the total rather than counting the time twice.
    const gained = before ? Math.max(0, event.duration - (before.duration ?? 0)) : 0;
    await Visitor.updateOne({ vid }, { $set: { lastSeenAt: now }, ...(gained ? { $inc: { seconds: gained } } : {}) });
    return { recorded: true as const };
  }

  if (event.type === "pageview") {
    const client = event.client ?? {};
    const device = parseUserAgent(request.userAgent, client);
    // First-touch attribution: recorded with the visitor and never overwritten, like firstReferrer.
    const source = classifySource({ referrer: event.referrer, utm: event.utm, inApp: device.inApp, ownHost: request.ownHost });
    await Promise.all([
      VisitorEvent.create({ vid, sid, pid, type: "pageview", path, referrer: event.landing ? event.referrer : "", ip: request.ip, createdAt: now }),
      upsertVisitor(vid, {
        $setOnInsert: {
          firstSeenAt: now,
          firstReferrer: event.referrer,
          firstLanding: path,
          utm: { source: event.utm?.source ?? "", medium: event.utm?.medium ?? "", campaign: event.utm?.campaign ?? "" },
          source,
        },
        $set: {
          lastSeenAt: now,
          lastPath: path,
          ...(knownIp ? { ip: request.ip } : {}),
          userAgent: request.userAgent,
          ...device,
          ...present({
            screen: client.screen,
            viewport: client.viewport,
            pixelRatio: client.pixelRatio,
            touchPoints: client.touchPoints,
            cpuCores: client.cpuCores,
            memoryGb: client.memoryGb,
            connection: client.connection,
            colorScheme: client.colorScheme,
            language: client.language,
            languages: client.languages,
            timezone: client.timezone,
          }),
          ...present(request.geo),
        },
        ...ipUpdate,
        $inc: { pageviews: 1, sessions: event.newSession ? 1 : 0 },
      }),
    ]);
    return { recorded: true as const };
  }

  const device = parseUserAgent(request.userAgent);
  // Tapping WhatsApp, a phone number or an email address is someone asking to be
  // contacted, so it promotes them to a lead just as the contact form does.
  const reachedOut = event.type === "form_submit" || (event.type === "outbound" && CONTACT_LINK.test(event.href));
  await Promise.all([
    VisitorEvent.create({
      vid,
      sid,
      pid,
      type: event.type,
      path,
      label: event.label,
      href: event.href,
      section: event.section,
      ip: request.ip,
      createdAt: now,
    }),
    upsertVisitor(vid, {
      // Device details come from page views (which carry client hints); only fill them in if this is the first sign of the visitor.
      $setOnInsert: {
        firstSeenAt: now,
        firstLanding: path,
        userAgent: request.userAgent,
        ...device,
        ...present(request.geo),
        source: classifySource({ inApp: device.inApp, ownHost: request.ownHost }),
      },
      $set: { lastSeenAt: now, ...(knownIp ? { ip: request.ip } : {}), ...(reachedOut ? { reachedOutAt: now } : {}) },
      ...ipUpdate,
      $inc: { actions: 1 },
    }),
  ]);
  return { recorded: true as const };
}

/**
 * Attach what a visitor typed into the contact form to their profile. Only
 * updates an existing visitor, so people the log skips (DNT, log off) stay out.
 */
export async function attachVisitorContact(
  vid: string,
  contact: { name: string; email: string; phone: string; address: string; messageId: string }
) {
  await connectDB();
  const result = await Visitor.updateOne({ vid }, { $set: { contact: { ...contact, at: new Date() } } });
  return result.matchedCount > 0;
}

/** Permanently remove a visitor and everything they did. */
export async function deleteVisitorLog(vid: string) {
  await connectDB();
  const [events] = await Promise.all([VisitorEvent.deleteMany({ vid }), Visitor.deleteOne({ vid })]);
  return events.deletedCount ?? 0;
}

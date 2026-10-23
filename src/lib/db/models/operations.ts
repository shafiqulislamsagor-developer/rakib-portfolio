import { Schema, Types, model, models, type InferSchemaType, type Model } from "mongoose";
import { ANALYTICS_METRICS, DEVICE_TYPES, MESSAGE_STATUSES, SOURCE_CHANNELS, VISITOR_EVENT_TYPES, VISITOR_LOG_TTL_SECONDS } from "@/lib/constants";

// ---------------------------------------------------------------- Contact messages

const MessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    address: { type: String, default: "", trim: true, maxlength: 200 },
    status: { type: String, enum: MESSAGE_STATUSES, default: "pending" },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    notes: [
      {
        body: { type: String, required: true, maxlength: 2000 },
        authorEmail: { type: String, default: "" },
        createdAt: { type: Date, default: () => new Date() },
      },
    ],
    replies: [
      {
        // The admin replies outside the panel (email, phone, WhatsApp…) and records it here.
        body: { type: String, maxlength: 2000 },
        sentBy: { type: String, default: "" },
        sentAt: { type: Date, default: () => new Date() },
      },
    ],
    meta: {
      ipHash: { type: String, default: "" },
      userAgent: { type: String, default: "", maxlength: 400 },
      country: { type: String, default: "" },
      spamScore: { type: Number, default: 0 },
      visitorId: { type: String, default: "" },
    },
    userId: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
  },
  { timestamps: true }
);
MessageSchema.index({ status: 1, createdAt: -1 });
MessageSchema.index({ read: 1, createdAt: -1 });
MessageSchema.index({ userId: 1 });
MessageSchema.index({ "meta.visitorId": 1 });
MessageSchema.index({ name: "text", email: "text", subject: "text", message: "text" });

export type MessageDoc = InferSchemaType<typeof MessageSchema> & { _id: Types.ObjectId };
export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) || model<MessageDoc>("Message", MessageSchema);

// ---------------------------------------------------------------- Media library

const MediaSchema = new Schema(
  {
    // Files live in MongoDB itself: `data` holds the bytes and is excluded from
    // normal queries (select: false); `url` points at the /media/[id]/[name] route.
    url: { type: String, required: true, unique: true },
    data: { type: Buffer, required: true, select: false },
    resourceType: { type: String, enum: ["image", "audio", "raw"], default: "image" },
    mimeType: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    originalName: { type: String, default: "", maxlength: 200 },
    alt: { type: String, default: "", trim: true, maxlength: 300 },
    caption: { type: String, default: "", trim: true, maxlength: 500 },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true }
);
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ originalName: "text", alt: "text", caption: "text" });

export type MediaDoc = InferSchemaType<typeof MediaSchema> & { _id: Types.ObjectId };
export const Media: Model<MediaDoc> = (models.Media as Model<MediaDoc>) || model<MediaDoc>("Media", MediaSchema);

// ---------------------------------------------------------------- Audit log

const ActivityLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, maxlength: 80 },
    entityType: { type: String, default: "", maxlength: 40 },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "", maxlength: 300 },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export type ActivityLogDoc = InferSchemaType<typeof ActivityLogSchema> & { _id: Types.ObjectId };
export const ActivityLog: Model<ActivityLogDoc> =
  (models.ActivityLog as Model<ActivityLogDoc>) || model<ActivityLogDoc>("ActivityLog", ActivityLogSchema);

// ---------------------------------------------------------------- First-party analytics (daily aggregates)

const AnalyticsDailySchema = new Schema({
  day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  metric: { type: String, enum: ANALYTICS_METRICS, required: true },
  key: { type: String, default: "", maxlength: 200 },
  count: { type: Number, default: 0 },
});
AnalyticsDailySchema.index({ day: 1, metric: 1, key: 1 }, { unique: true });
AnalyticsDailySchema.index({ metric: 1, day: 1 });

export type AnalyticsDailyDoc = InferSchemaType<typeof AnalyticsDailySchema>;
export const AnalyticsDaily: Model<AnalyticsDailyDoc> =
  (models.AnalyticsDaily as Model<AnalyticsDailyDoc>) ||
  model<AnalyticsDailyDoc>("AnalyticsDaily", AnalyticsDailySchema);

// Short-lived, salted visitor hashes used only to count daily unique visitors.
const VisitorMarkSchema = new Schema({
  day: { type: String, required: true },
  hash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});
VisitorMarkSchema.index({ day: 1, hash: 1 }, { unique: true });
VisitorMarkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 48 });

export type VisitorMarkDoc = InferSchemaType<typeof VisitorMarkSchema>;
export const VisitorMark: Model<VisitorMarkDoc> =
  (models.VisitorMark as Model<VisitorMarkDoc>) || model<VisitorMarkDoc>("VisitorMark", VisitorMarkSchema);

// ---------------------------------------------------------------- Visitor log (individual visitors and their actions)

// One document per browser. `vid` is a random id the tracker keeps in localStorage.
const VisitorSchema = new Schema({
  vid: { type: String, required: true, unique: true },
  ip: { type: String, default: "" },
  ips: { type: [String], default: [] },
  userAgent: { type: String, default: "", maxlength: 400 },
  browser: { type: String, default: "" },
  browserVersion: { type: String, default: "" },
  os: { type: String, default: "" },
  osVersion: { type: String, default: "" },
  deviceType: { type: String, enum: DEVICE_TYPES, default: "unknown" },
  deviceVendor: { type: String, default: "" },
  deviceModel: { type: String, default: "" },
  deviceName: { type: String, default: "" },
  inApp: { type: String, default: "" },
  screen: { type: String, default: "" },
  viewport: { type: String, default: "" },
  pixelRatio: { type: Number, default: null },
  touchPoints: { type: Number, default: null },
  cpuCores: { type: Number, default: null },
  memoryGb: { type: Number, default: null },
  connection: { type: String, default: "" },
  colorScheme: { type: String, default: "" },
  language: { type: String, default: "" },
  languages: { type: String, default: "" },
  timezone: { type: String, default: "" },
  country: { type: String, default: "" },
  region: { type: String, default: "" },
  city: { type: String, default: "" },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
  firstReferrer: { type: String, default: "", maxlength: 1000 },
  firstLanding: { type: String, default: "" },
  utm: {
    source: { type: String, default: "" },
    medium: { type: String, default: "" },
    campaign: { type: String, default: "" },
  },
  // How they arrived, worked out once from the first visit (see lib/analytics/source).
  source: {
    channel: { type: String, enum: SOURCE_CHANNELS, default: "direct" },
    name: { type: String, default: "", maxlength: 120 },
  },
  lastPath: { type: String, default: "" },
  // Filled in when this visitor sends the contact form (what they typed, nothing more).
  contact: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    messageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    at: { type: Date, default: null },
  },
  /** Last time they tapped a way of contacting you (WhatsApp, phone, email) or sent the form. */
  reachedOutAt: { type: Date, default: null },
  // The one field a human sets: the admin confirming this visitor became a customer.
  customer: { type: Boolean, default: false },
  customerAt: { type: Date, default: null },
  sessions: { type: Number, default: 0 },
  pageviews: { type: Number, default: 0 },
  actions: { type: Number, default: 0 },
  /** Seconds spent with the tab visible, summed across page views. */
  seconds: { type: Number, default: 0 },
  firstSeenAt: { type: Date, default: () => new Date() },
  lastSeenAt: { type: Date, default: () => new Date() },
});
VisitorSchema.index({ visitorId: 1 });
VisitorSchema.index({ lastSeenAt: -1 });
VisitorSchema.index({ firstSeenAt: -1 });
VisitorSchema.index({ deviceType: 1, lastSeenAt: -1 });
VisitorSchema.index({ "source.channel": 1, lastSeenAt: -1 });
VisitorSchema.index({ customer: 1, lastSeenAt: -1 });
VisitorSchema.index({ "contact.at": -1 });
VisitorSchema.index({ reachedOutAt: -1 });
VisitorSchema.index({ sessions: -1 });
VisitorSchema.index({ ip: 1 });
VisitorSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: VISITOR_LOG_TTL_SECONDS });

export type VisitorDoc = InferSchemaType<typeof VisitorSchema> & { _id: Types.ObjectId };
export const Visitor: Model<VisitorDoc> = (models.Visitor as Model<VisitorDoc>) || model<VisitorDoc>("Visitor", VisitorSchema);

// Every page view and action. Page views also collect time on page, scroll depth and sections seen.
const VisitorEventSchema = new Schema({
  vid: { type: String, required: true },
  visitorId: { type: String, default: "" },
  sid: { type: String, default: "" },
  pid: { type: String, default: "" },
  type: { type: String, enum: VISITOR_EVENT_TYPES, required: true },
  path: { type: String, default: "", maxlength: 300 },
  referrer: { type: String, default: "", maxlength: 1000 },
  label: { type: String, default: "", maxlength: 160 },
  href: { type: String, default: "", maxlength: 1000 },
  section: { type: String, default: "", maxlength: 60 },
  duration: { type: Number, default: 0 },
  depth: { type: Number, default: 0 },
  sections: { type: [String], default: [] },
  ip: { type: String, default: "" },
  createdAt: { type: Date, default: () => new Date() },
});
VisitorEventSchema.index({ vid: 1 });
VisitorEventSchema.index({ visitorId: 1 });
VisitorEventSchema.index({ vid: 1, createdAt: -1 });
VisitorEventSchema.index({ vid: 1, pid: 1 });
VisitorEventSchema.index({ type: 1, createdAt: -1 });
VisitorEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: VISITOR_LOG_TTL_SECONDS });

export type VisitorEventDoc = InferSchemaType<typeof VisitorEventSchema> & { _id: Types.ObjectId };
export const VisitorEvent: Model<VisitorEventDoc> =
  (models.VisitorEvent as Model<VisitorEventDoc>) || model<VisitorEventDoc>("VisitorEvent", VisitorEventSchema);

// ---------------------------------------------------------------- Server error capture

const ErrorEventSchema = new Schema(
  {
    message: { type: String, default: "", maxlength: 1000 },
    digest: { type: String, default: "" },
    path: { type: String, default: "", maxlength: 500 },
    method: { type: String, default: "" },
    routeType: { type: String, default: "" },
    stack: { type: String, default: "", maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
ErrorEventSchema.index({ createdAt: -1 });
ErrorEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type ErrorEventDoc = InferSchemaType<typeof ErrorEventSchema> & { _id: Types.ObjectId };
export const ErrorEvent: Model<ErrorEventDoc> =
  (models.ErrorEvent as Model<ErrorEventDoc>) || model<ErrorEventDoc>("ErrorEvent", ErrorEventSchema);

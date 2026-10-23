import { Schema, Types, model, models, type InferSchemaType, type Model } from "mongoose";
import { ADMIN_ROLES } from "@/lib/constants";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "owner" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type AdminUserDoc = InferSchemaType<typeof AdminUserSchema> & { _id: Types.ObjectId };
export const AdminUser: Model<AdminUserDoc> =
  (models.AdminUser as Model<AdminUserDoc>) || model<AdminUserDoc>("AdminUser", AdminUserSchema);

const SessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "", maxlength: 400 },
    lastSeenAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
// MongoDB removes expired sessions automatically.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = InferSchemaType<typeof SessionSchema> & { _id: Types.ObjectId };
export const Session: Model<SessionDoc> =
  (models.Session as Model<SessionDoc>) || model<SessionDoc>("Session", SessionSchema);

const LoginEventSchema = new Schema(
  {
    email: { type: String, default: "", lowercase: true, trim: true, maxlength: 160 },
    userId: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    success: { type: Boolean, required: true },
    reason: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "", maxlength: 400 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
LoginEventSchema.index({ createdAt: -1 });
LoginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export type LoginEventDoc = InferSchemaType<typeof LoginEventSchema> & { _id: Types.ObjectId };
export const LoginEvent: Model<LoginEventDoc> =
  (models.LoginEvent as Model<LoginEventDoc>) || model<LoginEventDoc>("LoginEvent", LoginEventSchema);

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDoc = InferSchemaType<typeof RateLimitSchema>;
export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc>) || model<RateLimitDoc>("RateLimit", RateLimitSchema);

/**
 * Server-side secrets (HMAC keys, token signing salt).
 * Security note: If `process.env.AUTH_SECRET` is set, it takes precedence over
 * database-stored secrets, enabling environment-managed secret injection and
 * key rotation. For enterprise deployments, client-side field level encryption
 * (CSFLE) can be applied to the `value` field without schema changes.
 */
const AppSecretSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

export type AppSecretDoc = InferSchemaType<typeof AppSecretSchema> & { _id: Types.ObjectId };
export const AppSecret: Model<AppSecretDoc> =
  (models.AppSecret as Model<AppSecretDoc>) || model<AppSecretDoc>("AppSecret", AppSecretSchema);


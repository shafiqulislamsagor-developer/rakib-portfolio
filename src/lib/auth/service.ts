import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { AdminUser, LoginEvent, RateLimit, Session } from "@/lib/db/models";
import { hmac, randomToken, sha256 } from "@/lib/security/crypto";
import { clearRateLimit, rateLimit } from "@/lib/security/rate-limit";
import { LOGIN_RATE_LIMITS } from "@/lib/security/rate-limit-config";
import { SESSION_IDLE_MS, SESSION_TOUCH_MS, SESSION_TTL_MS, TOKEN_LENGTH } from "./constants";
import { getDummyHash, hashPassword, verifyPassword } from "./password";

// Pure auth logic (no Next.js APIs) so it can be unit tested and used by scripts.

export const LOGIN_LIMITS = LOGIN_RATE_LIMITS;

export type AuthenticatedUser = { id: string; email: string; name: string; role: string };

type LoginContext = { ip: string; userAgent: string };

export type LoginResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; error: string; status: "invalid" | "rate_limited" };

const GENERIC_ERROR = "Invalid email or password.";
const LOCKED_ERROR = "Too many sign-in attempts. Please wait 15 minutes and try again.";

export async function authenticate(email: string, password: string, context: LoginContext): Promise<LoginResult> {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  const ipKey = `login:ip:${hmac(context.ip)}`;
  const emailKey = `login:email:${hmac(normalizedEmail)}`;
  const record = (success: boolean, reason: string, userId: Types.ObjectId | null = null) =>
    LoginEvent.create({ email: normalizedEmail, userId, success, reason, ip: context.ip, userAgent: context.userAgent });

  const ipLimit = await rateLimit(ipKey, LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowMs);
  if (!ipLimit.allowed) {
    await record(false, "rate_limited_ip");
    return { ok: false, error: LOCKED_ERROR, status: "rate_limited" };
  }

  const failures = await RateLimit.findOne({ key: emailKey, expiresAt: { $gt: new Date() } }).lean();
  if (failures && failures.count >= LOGIN_LIMITS.perEmailFailures.limit) {
    await record(false, "rate_limited_account");
    return { ok: false, error: LOCKED_ERROR, status: "rate_limited" };
  }

  const user = await AdminUser.findOne({ email: normalizedEmail }).select("+passwordHash").lean();
  // Always run a hash comparison so timing does not reveal whether the account exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !valid || !user.active) {
    await rateLimit(emailKey, LOGIN_LIMITS.perEmailFailures.limit, LOGIN_LIMITS.perEmailFailures.windowMs);
    await record(false, !user ? "unknown_email" : !user.active ? "inactive" : "bad_password", user?._id ?? null);
    return { ok: false, error: GENERIC_ERROR, status: "invalid" };
  }

  await clearRateLimit(emailKey);
  await AdminUser.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await record(true, "ok", user._id);
  return { ok: true, user: toAuthenticatedUser(user) };
}

function toAuthenticatedUser(user: { _id: Types.ObjectId; email: string; name: string; role?: string | null }) {
  return { id: user._id.toString(), email: user.email, name: user.name, role: user.role ?? "owner" };
}

export async function createSession(userId: string, context: LoginContext) {
  await connectDB();
  const token = randomToken(TOKEN_LENGTH);
  const now = Date.now();
  const session = await Session.create({
    tokenHash: sha256(token),
    userId: new Types.ObjectId(userId),
    ip: context.ip,
    userAgent: context.userAgent,
    lastSeenAt: new Date(now),
    expiresAt: new Date(now + SESSION_TTL_MS),
  });
  return { token, sessionId: session._id.toString(), expiresAt: session.expiresAt };
}

export type ValidSession = {
  sessionId: string;
  user: AuthenticatedUser;
  expiresAt: Date;
};

export async function validateSessionToken(token: string): Promise<ValidSession | null> {
  if (!token || token.length > 200) return null;
  await connectDB();
  const now = Date.now();
  const session = await Session.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date(now) } }).lean();
  if (!session) return null;

  if (now - session.lastSeenAt.getTime() > SESSION_IDLE_MS) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  const user = await AdminUser.findById(session.userId).lean();
  if (!user || !user.active) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  if (now - session.lastSeenAt.getTime() > SESSION_TOUCH_MS) {
    await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date(now) } });
  }

  return { sessionId: session._id.toString(), user: toAuthenticatedUser(user), expiresAt: session.expiresAt };
}

export async function revokeSessionToken(token: string) {
  await connectDB();
  await Session.deleteOne({ tokenHash: sha256(token) });
}

export async function revokeSession(userId: string, sessionId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(sessionId)) return false;
  const result = await Session.deleteOne({ _id: sessionId, userId });
  return result.deletedCount === 1;
}

export async function revokeOtherSessions(userId: string, keepSessionId: string) {
  await connectDB();
  const result = await Session.deleteMany({ userId, _id: { $ne: keepSessionId } });
  return result.deletedCount;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  await connectDB();
  const user = await AdminUser.findById(userId).select("+passwordHash");
  if (!user) return { ok: false as const, error: "Account not found." };
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false as const, error: "Your current password is incorrect." };
  }
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();
  return { ok: true as const };
}

export async function createAdminUser(input: { email: string; name: string; password: string }) {
  await connectDB();
  const email = input.email.trim().toLowerCase();
  const existing = await AdminUser.findOne({ email }).lean();
  if (existing) throw new Error(`An admin with email ${email} already exists.`);
  const user = await AdminUser.create({
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    role: (await AdminUser.countDocuments()) === 0 ? "owner" : "admin",
    passwordChangedAt: new Date(),
  });
  return toAuthenticatedUser(user);
}

export async function resetAdminPassword(email: string, password: string) {
  await connectDB();
  const user = await AdminUser.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  if (!user) throw new Error(`No admin with email ${email}.`);
  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  await user.save();
  await Session.deleteMany({ userId: user._id });
  return toAuthenticatedUser(user);
}

import { beforeAll, describe, expect, it } from "vitest";
import {
  LOGIN_LIMITS,
  authenticate,
  changePassword,
  createAdminUser,
  createSession,
  revokeOtherSessions,
  revokeSession,
  revokeSessionToken,
  validateSessionToken,
} from "@/lib/auth/service";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { AdminUser, LoginEvent, Session } from "@/lib/db/models";
import { SESSION_IDLE_MS } from "@/lib/auth/constants";

const context = { ip: "203.0.113.10", userAgent: "vitest" };
const EMAIL = "owner@example.com";
const PASSWORD = "correct horse battery 42";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("s3cret-password-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("s3cret");
    await expect(verifyPassword("s3cret-password-123", hash)).resolves.toBe(true);
    await expect(verifyPassword("s3cret-password-124", hash)).resolves.toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same-password-1")).not.toEqual(await hashPassword("same-password-1"));
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "plain-text")).resolves.toBe(false);
  });
});

describe("authentication", () => {
  let userId = "";

  beforeAll(async () => {
    await connectDB();
    const user = await createAdminUser({ email: EMAIL, name: "Owner", password: PASSWORD });
    userId = user.id;
  });

  it("creates the first account as owner and never stores the plain password", async () => {
    const stored = await AdminUser.findOne({ email: EMAIL }).select("+passwordHash").lean();
    expect(stored?.role).toBe("owner");
    expect(stored?.passwordHash).not.toContain(PASSWORD);
  });

  it("refuses duplicate admin emails", async () => {
    await expect(createAdminUser({ email: EMAIL.toUpperCase(), name: "Dup", password: PASSWORD })).rejects.toThrow();
  });

  it("signs in with valid credentials (case-insensitive email)", async () => {
    const result = await authenticate("Owner@Example.com", PASSWORD, context);
    expect(result.ok).toBe(true);
    expect(await LoginEvent.countDocuments({ success: true })).toBe(1);
  });

  it("returns the same generic error for unknown email and wrong password", async () => {
    const unknown = await authenticate("nobody@example.com", PASSWORD, { ...context, ip: "198.51.100.1" });
    const wrong = await authenticate(EMAIL, "wrong-password-1", { ...context, ip: "198.51.100.2" });
    expect(unknown).toEqual({ ok: false, error: "Invalid email or password.", status: "invalid" });
    expect(wrong).toEqual(unknown);
  });

  it("locks an account after repeated failures, even with the right password", async () => {
    const email = "locked@example.com";
    await createAdminUser({ email, name: "Locked", password: PASSWORD });
    for (let attempt = 0; attempt < LOGIN_LIMITS.perEmailFailures.limit; attempt += 1) {
      await authenticate(email, `wrong-${attempt}-password`, { ...context, ip: `192.0.2.${attempt}` });
    }
    const result = await authenticate(email, PASSWORD, { ...context, ip: "192.0.2.200" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("rate_limited");
  });

  it("rate limits a single IP across accounts", async () => {
    const ip = "198.51.100.77";
    let last;
    for (let attempt = 0; attempt <= LOGIN_LIMITS.perIp.limit; attempt += 1) {
      last = await authenticate(`user${attempt}@example.com`, "nope-nope-1", { ...context, ip });
    }
    expect(last?.ok).toBe(false);
    if (last && !last.ok) expect(last.status).toBe("rate_limited");
  });

  it("creates, validates and revokes sessions; only a hash of the token is stored", async () => {
    const { token, sessionId } = await createSession(userId, context);
    expect(await Session.findOne({ tokenHash: token })).toBeNull();

    const valid = await validateSessionToken(token);
    expect(valid?.user.email).toBe(EMAIL);
    expect(valid?.sessionId).toBe(sessionId);

    expect(await validateSessionToken("forged-token")).toBeNull();
    await revokeSessionToken(token);
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("expires idle sessions", async () => {
    const { token, sessionId } = await createSession(userId, context);
    await Session.updateOne({ _id: sessionId }, { $set: { lastSeenAt: new Date(Date.now() - SESSION_IDLE_MS - 1000) } });
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("rejects sessions of deactivated users", async () => {
    const other = await createAdminUser({ email: "inactive@example.com", name: "Inactive", password: PASSWORD });
    const { token } = await createSession(other.id, context);
    await AdminUser.updateOne({ email: "inactive@example.com" }, { $set: { active: false } });
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("revokes a specific session only for its owner, and all other sessions", async () => {
    const a = await createSession(userId, context);
    const b = await createSession(userId, context);
    const intruder = await createAdminUser({ email: "second@example.com", name: "Second", password: PASSWORD });
    expect(await revokeSession(intruder.id, a.sessionId)).toBe(false);
    expect(await revokeSession(userId, a.sessionId)).toBe(true);
    await createSession(userId, context);
    await revokeOtherSessions(userId, b.sessionId);
    expect(await Session.countDocuments({ userId })).toBe(1);
    expect(await validateSessionToken(b.token)).not.toBeNull();
  });

  it("changes the password only with the current password", async () => {
    expect((await changePassword(userId, "not-the-password", "new-password-12345")).ok).toBe(false);
    expect((await changePassword(userId, PASSWORD, "new-password-12345")).ok).toBe(true);
    expect((await authenticate(EMAIL, "new-password-12345", { ...context, ip: "10.0.0.9" })).ok).toBe(true);
  });
});

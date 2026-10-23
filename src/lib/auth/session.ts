import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isDbConfigured, isProduction } from "@/lib/env";
import { getClientIp, getUserAgent } from "@/lib/security/request";
import { SESSION_COOKIE, SESSION_TTL_MS } from "./constants";
import { createSession, revokeSessionToken, validateSessionToken, type ValidSession } from "./service";

/** The signed-in admin for this request, or null. Deduplicated per request. */
export const getSession = cache(async (): Promise<ValidSession | null> => {
  if (!isDbConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await validateSessionToken(token);
  } catch (error) {
    console.error("[auth] session validation failed", error);
    return null;
  }
});

/**
 * Server-side authorization gate. Call at the top of every admin page,
 * Server Action and data loader — never rely on hiding UI alone.
 */
export async function requireAdmin(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function getRequestContext() {
  const requestHeaders = await headers();
  return { ip: getClientIp(requestHeaders), userAgent: getUserAgent(requestHeaders) };
}

export async function startSession(userId: string) {
  const context = await getRequestContext();
  const { token, expiresAt } = await createSession(userId, context);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await revokeSessionToken(token).catch(() => undefined);
  store.delete(SESSION_COOKIE);
}

"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/audit";
import { authenticate } from "@/lib/auth/service";
import { endSession, getRequestContext, getSession, startSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/env";
import { loginSchema } from "@/lib/validation/admin";

export type LoginState = { error: string | null };

function safeNext(value: unknown) {
  return typeof value === "string" && /^\/admin(\/[\w\-/?=&%.]*)?$/.test(value) && !value.startsWith("//")
    ? value
    : "/admin";
}

export async function login(input: { email: string; password: string; next?: string }): Promise<LoginState> {
  if (!isDbConfigured()) {
    return { error: "The database is not configured yet. Set MONGODB_URI and create an admin account first." };
  }
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const context = await getRequestContext();
  let result;
  try {
    result = await authenticate(parsed.data.email, parsed.data.password, context);
  } catch (error) {
    console.error("[auth] login failed", error);
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  if (!result.ok) return { error: result.error };

  await startSession(result.user.id);
  await logActivity({ id: result.user.id, email: result.user.email }, "auth.login", { ip: context.ip, summary: "Signed in" });
  redirect(safeNext(input.next));
}

export async function logout() {
  const session = await getSession();
  if (session) {
    const { ip } = await getRequestContext();
    await logActivity({ id: session.user.id, email: session.user.email }, "auth.logout", { ip, summary: "Signed out" });
  }
  await endSession();
  redirect("/admin/login");
}

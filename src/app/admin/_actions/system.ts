"use server";

import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { changePassword, revokeOtherSessions, revokeSession } from "@/lib/auth/service";
import { AdminUser, ErrorEvent } from "@/lib/db/models";
import { accountSchema, changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/content";

export async function changeOwnPassword(input: ChangePasswordInput): Promise<ActionResult> {
  return adminAction(async ({ session, actor, ip }) => {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const result = await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    if (!result.ok) throw new ActionError(result.error, { currentPassword: [result.error] });
    // Every other device must sign in again with the new password.
    const revoked = await revokeOtherSessions(session.user.id, session.sessionId);
    await logActivity(actor, "account.password", { entityType: "account", summary: `Changed password and signed out ${revoked} other session(s)`, ip });
    revalidatePath("/admin/system");
    return { ok: true, message: revoked ? `Password changed. ${revoked} other session(s) signed out.` : "Password changed" };
  });
}

export async function updateAccountName(name: string): Promise<ActionResult> {
  return adminAction(async ({ session, actor, ip }) => {
    const parsed = accountSchema.safeParse({ name });
    if (!parsed.success) return invalid(parsed.error);
    await AdminUser.updateOne({ _id: session.user.id }, { $set: { name: parsed.data.name } });
    await logActivity(actor, "account.update", { entityType: "account", summary: "Updated display name", ip });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Name updated" };
  });
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  return adminAction(async ({ session, actor, ip }) => {
    if (sessionId === session.sessionId) throw new ActionError("Use “Sign out” to end your current session.");
    if (!(await revokeSession(session.user.id, sessionId))) throw new ActionError("Session not found.");
    await logActivity(actor, "session.revoke", { entityType: "session", entityId: sessionId, summary: "Signed out a session", ip });
    revalidatePath("/admin/system");
    return { ok: true, message: "Session signed out" };
  });
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  return adminAction(async ({ session, actor, ip }) => {
    const count = await revokeOtherSessions(session.user.id, session.sessionId);
    await logActivity(actor, "session.revoke_all", { entityType: "session", summary: `Signed out ${count} other session(s)`, ip });
    revalidatePath("/admin/system");
    return { ok: true, message: count ? `Signed out ${count} other session(s)` : "No other sessions" };
  });
}

export async function clearErrorEvents(): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const { deletedCount } = await ErrorEvent.deleteMany({});
    await logActivity(actor, "errors.clear", { entityType: "system", summary: `Cleared ${deletedCount} error event(s)`, ip });
    revalidatePath("/admin/system");
    return { ok: true, message: "Error log cleared" };
  });
}

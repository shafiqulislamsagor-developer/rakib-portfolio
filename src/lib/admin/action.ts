import "server-only";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { ZodError } from "zod";
import type { AuditActor } from "@/lib/audit";
import { getRequestContext, requireAdmin } from "@/lib/auth/session";
import type { ValidSession } from "@/lib/auth/service";
import { connectDB } from "@/lib/db/connect";
import { zodFieldErrors } from "@/lib/validation/common";
import type { ActionResult } from "@/types/content";

export type AdminContext = { session: ValidSession; actor: AuditActor; ip: string };

export class ActionError extends Error {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(message);
  }
}

/**
 * Every admin Server Action runs through here: the session is validated on
 * the server first, then the handler runs with a connected database. Known
 * failures become friendly messages; unexpected errors are logged and never
 * leak internals to the browser.
 */
export async function adminAction<T>(handler: (context: AdminContext) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const session = await requireAdmin();
  try {
    await connectDB();
    const { ip } = await getRequestContext();
    return await handler({ session, actor: { id: session.user.id, email: session.user.email }, ip });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    if ((error as { code?: number }).code === 11000) {
      const field = Object.keys((error as { keyPattern?: Record<string, number> }).keyPattern ?? {})[0] ?? "field";
      return { ok: false, error: `That ${field} is already in use.`, fieldErrors: { [field]: [`This ${field} is already in use`] } };
    }
    console.error("[admin action] failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export function invalid(error: ZodError): ActionResult<never> {
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(error) };
}

/** Purge every statically rendered public page so published changes appear immediately. */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
}

import { connectDB } from "@/lib/db/connect";
import { ActivityLog } from "@/lib/db/models";

export type AuditActor = { id: string; email: string };

export async function logActivity(
  actor: AuditActor | null,
  action: string,
  details: { entityType?: string; entityId?: string; summary?: string; ip?: string } = {}
) {
  try {
    await connectDB();
    await ActivityLog.create({
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? "",
      action,
      entityType: details.entityType ?? "",
      entityId: details.entityId ?? "",
      summary: (details.summary ?? "").slice(0, 300),
      ip: details.ip ?? "",
    });
  } catch (error) {
    // Audit logging must never break the action it records.
    console.error("[audit] failed to record activity", action, error);
  }
}

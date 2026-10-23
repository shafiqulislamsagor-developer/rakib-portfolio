"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction } from "@/lib/admin/action";
import { deleteVisitorLog } from "@/lib/analytics/visitors";
import { logActivity } from "@/lib/audit";
import { Visitor } from "@/lib/db/models";
import type { ActionResult } from "@/types/content";

/** Removes a visitor and their whole activity history (e.g. your own test visits). */
export async function deleteVisitor(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!Types.ObjectId.isValid(id)) throw new ActionError("Visitor not found.");
    const visitor = await Visitor.findById(id).select("vid deviceName ip").lean();
    if (!visitor) throw new ActionError("Visitor not found.");
    const events = await deleteVisitorLog(visitor.vid);
    await logActivity(actor, "visitor.delete", {
      entityType: "visitor",
      entityId: id,
      summary: `Deleted visitor ${visitor.deviceName || "unknown device"} (${visitor.ip || "no IP"}) and ${events} recorded events`,
      ip,
    });
    revalidatePath("/admin/visitors");
    return { ok: true, message: "Visitor deleted" };
  });
}

/**
 * Mark a visitor as a customer, or take the mark off again. This is the only
 * field on a visitor a human sets: everything else the log records is what the
 * visitor's own browser sent.
 */
export async function setVisitorCustomer(id: string, customer: boolean): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!Types.ObjectId.isValid(id)) throw new ActionError("Visitor not found.");
    const visitor = await Visitor.findByIdAndUpdate(
      id,
      { $set: { customer, customerAt: customer ? new Date() : null } },
      { new: true, projection: "deviceName contact.name" }
    ).lean();
    if (!visitor) throw new ActionError("Visitor not found.");
    const who = visitor.contact?.name || visitor.deviceName || "unknown device";
    await logActivity(actor, customer ? "visitor.mark_customer" : "visitor.unmark_customer", {
      entityType: "visitor",
      entityId: id,
      summary: customer ? `Marked ${who} as a customer` : `Removed the customer mark from ${who}`,
      ip,
    });
    revalidatePath("/admin/visitors");
    revalidatePath(`/admin/visitors/${id}`);
    return { ok: true, message: customer ? "Marked as a customer" : "Customer mark removed" };
  });
}

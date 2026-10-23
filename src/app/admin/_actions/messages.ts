"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { Message } from "@/lib/db/models";
import { messageNoteSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/content";

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("Message not found.");
}

function refresh(id?: string) {
  revalidatePath("/admin", "layout"); // unread badge + notifications
  if (id) revalidatePath(`/admin/messages/${id}`);
}

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    assertId(id);
    const result = await Message.updateOne({ _id: id }, { $set: { read, readAt: read ? new Date() : null } });
    if (!result.matchedCount) throw new ActionError("Message not found.");
    refresh(id);
    return { ok: true, message: read ? "Marked as read" : "Marked as unread" };
  });
}

/** Opening a message marks it read (called from the detail page on mount, not on prefetch). */
export async function markMessageViewed(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    assertId(id);
    const result = await Message.updateOne({ _id: id, read: false }, { $set: { read: true, readAt: new Date() } });
    if (result.modifiedCount) refresh();
    return { ok: true };
  });
}

/** Status changes from the inbox. "replied" can only be set by actually replying (or recording a reply). */
export async function setMessageStatus(id: string, status: "pending" | "spam" | "archived"): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    if (!["pending", "spam", "archived"].includes(status)) throw new ActionError("Invalid status.");
    const message = await Message.findById(id);
    if (!message) throw new ActionError("Message not found.");
    const previous = message.status;
    // Restoring a replied message from the archive keeps its replied state.
    message.status = status === "pending" && message.replies.length > 0 ? "replied" : status;
    if (status !== "pending") message.read = true;
    await message.save();
    await logActivity(actor, `message.${status}`, {
      entityType: "message",
      entityId: id,
      summary: `Moved message from ${message.email} (${previous} → ${message.status})`,
      ip,
    });
    refresh(id);
    return {
      ok: true,
      message: status === "spam" ? "Marked as spam" : status === "archived" ? "Archived" : "Moved back to the inbox",
    };
  });
}

export async function addMessageNote(id: string, body: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const parsed = messageNoteSchema.safeParse({ body });
    if (!parsed.success) return invalid(parsed.error);
    const result = await Message.updateOne(
      { _id: id },
      { $push: { notes: { body: parsed.data.body, authorEmail: actor.email, createdAt: new Date() } } }
    );
    if (!result.matchedCount) throw new ActionError("Message not found.");
    await logActivity(actor, "message.note", { entityType: "message", entityId: id, summary: "Added an internal note", ip });
    refresh(id);
    return { ok: true, message: "Note added" };
  });
}

export async function deleteMessageNote(id: string, noteId: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    if (!Types.ObjectId.isValid(noteId)) throw new ActionError("Note not found.");
    await Message.updateOne({ _id: id }, { $pull: { notes: { _id: new Types.ObjectId(noteId) } } });
    await logActivity(actor, "message.note.delete", { entityType: "message", entityId: id, summary: "Deleted an internal note", ip });
    refresh(id);
    return { ok: true, message: "Note deleted" };
  });
}

/**
 * You contact the sender yourself (email, phone, WhatsApp…) and then mark the
 * message as replied here. The status is never inferred from opening a link.
 */
export async function markMessageReplied(id: string, note: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const message = await Message.findById(id);
    if (!message) throw new ActionError("Message not found.");
    message.replies.push({ body: note.trim().slice(0, 2000), sentBy: actor.email, sentAt: new Date() });
    message.status = "replied";
    message.read = true;
    message.repliedAt = new Date();
    await message.save();
    await logActivity(actor, "message.replied", { entityType: "message", entityId: id, summary: `Marked message from ${message.email} as replied`, ip });
    refresh(id);
    return { ok: true, message: "Recorded as replied" };
  });
}

/** Deletion is limited to archived or spam messages so active inquiries cannot be removed by accident. */
export async function deleteMessage(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const message = await Message.findById(id).select("status email subject").lean();
    if (!message) throw new ActionError("Message not found.");
    if (message.status !== "archived" && message.status !== "spam") {
      throw new ActionError("Archive the message (or mark it as spam) before deleting it.");
    }
    await Message.deleteOne({ _id: id });
    await logActivity(actor, "message.delete", { entityType: "message", entityId: id, summary: `Deleted message from ${message.email}: “${message.subject}”`, ip });
    refresh();
    revalidatePath("/admin/messages");
    return { ok: true, message: "Message deleted" };
  });
}

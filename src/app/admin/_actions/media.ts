"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { Media, Page, Post, Profile, Project, Settings, Testimonial } from "@/lib/db/models";
import { findMediaUsage, type MediaUsage } from "@/lib/services/content";
import { mediaMetaSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/content";

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("File not found.");
}

export async function updateMediaMeta(id: string, input: { alt: string; caption: string }): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const parsed = mediaMetaSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const media = await Media.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean();
    if (!media) throw new ActionError("File not found.");
    await logActivity(actor, "media.update", { entityType: "media", entityId: id, summary: `Updated details for ${media.originalName || media.url}`, ip });
    revalidatePath("/admin/media");
    return { ok: true, message: "Details saved" };
  });
}

export async function getMediaUsage(id: string): Promise<ActionResult<MediaUsage[]>> {
  return adminAction<MediaUsage[]>(async () => {
    assertId(id);
    const media = await Media.findById(id).select("url").lean();
    if (!media) throw new ActionError("File not found.");
    return { ok: true, data: await findMediaUsage(media.url) };
  });
}

/**
 * Deletes a file (stored in MongoDB) from the library. Refuses while published
 * content still uses it; draft-only usage requires explicit confirmation.
 */
export async function deleteMedia(id: string, force = false): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const media = await Media.findById(id).lean();
    if (!media) throw new ActionError("File not found.");
    const usage = await findMediaUsage(media.url);
    const live = usage.filter((item) => item.published);
    if (live.length) {
      return {
        ok: false,
        error: `Used by published content (${live.map((item) => `${item.type}: ${item.label}`).join(", ")}). Replace or remove it there first.`,
      };
    }
    if (usage.length && !force) {
      return { ok: false, error: `Used by ${usage.length} draft item(s). Confirm deletion to continue.` };
    }
    // The bytes live in the same document, so deleting it removes the file.
    await Media.deleteOne({ _id: id });
    await logActivity(actor, "media.delete", { entityType: "media", entityId: id, summary: `Deleted ${media.originalName || media.url}`, ip });
    revalidatePath("/admin/media");
    return { ok: true, message: "File deleted" };
  });
}

/** Point every reference to one file at another (e.g. after uploading a replacement), then optionally delete the old file. */
export async function replaceMediaReferences(oldId: string, newId: string, removeOld: boolean): Promise<ActionResult<{ updated: number }>> {
  return adminAction<{ updated: number }>(async ({ actor, ip }) => {
    assertId(oldId);
    assertId(newId);
    const [oldMedia, newMedia] = await Promise.all([Media.findById(oldId).lean(), Media.findById(newId).lean()]);
    if (!oldMedia || !newMedia) throw new ActionError("File not found.");
    const from = oldMedia.url;
    const to = newMedia.url;
    const replaceIn = (field: string) => ({ $replaceAll: { input: { $ifNull: [`$${field}`, ""] }, find: from, replacement: to } });

    const results = await Promise.all([
      Project.updateMany({ "thumbnail.url": from }, { $set: { "thumbnail.url": to } }),
      Project.updateMany({ "cover.url": from }, { $set: { "cover.url": to } }),
      Project.updateMany({ "gallery.url": from }, { $set: { "gallery.$[item].url": to } }, { arrayFilters: [{ "item.url": from }] }),
      Project.updateMany({ "seo.ogImage": from }, { $set: { "seo.ogImage": to } }),
      Project.updateMany({ content: { $regex: escapeRegex(from) } }, [{ $set: { content: replaceIn("content") } }]),
      Post.updateMany({ "coverImage.url": from }, { $set: { "coverImage.url": to } }),
      Post.updateMany({ "seo.ogImage": from }, { $set: { "seo.ogImage": to } }),
      Post.updateMany({ content: { $regex: escapeRegex(from) } }, [{ $set: { content: replaceIn("content") } }]),
      Page.updateMany({ "seo.ogImage": from }, { $set: { "seo.ogImage": to } }),
      Page.updateMany({ content: { $regex: escapeRegex(from) } }, [{ $set: { content: replaceIn("content") } }]),
      Testimonial.updateMany({ "avatar.url": from }, { $set: { "avatar.url": to } }),
      Profile.updateMany({ "avatar.url": from }, { $set: { "avatar.url": to } }),
      Profile.updateMany({ "cv.url": from }, { $set: { "cv.url": to, "cv.updatedAt": new Date() } }),
      Settings.updateMany({ "logo.url": from }, { $set: { "logo.url": to } }),
      Settings.updateMany({ faviconUrl: from }, { $set: { faviconUrl: to } }),
      Settings.updateMany({ "seo.ogImage": from }, { $set: { "seo.ogImage": to } }),
    ]);
    const updated = results.reduce((sum, result) => sum + result.modifiedCount, 0);

    if (removeOld) await Media.deleteOne({ _id: oldId });
    await logActivity(actor, "media.replace", {
      entityType: "media",
      entityId: newId,
      summary: `Replaced ${oldMedia.originalName || from} in ${updated} place(s)${removeOld ? " and deleted the old file" : ""}`,
      ip,
    });
    revalidatePublicSite();
    revalidatePath("/admin/media");
    return { ok: true, data: { updated }, message: `Replaced in ${updated} place(s)` };
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { POST_STATUSES, type PostStatus } from "@/lib/constants";
import { Post } from "@/lib/db/models";
import { readingMinutes } from "@/lib/format";
import { findSlugConflict, nextPreviousSlugs, uniqueCopySlug } from "@/lib/services/content";
import { omit } from "@/lib/utils";
import { postSchema, type PostInput } from "@/lib/validation/content";
import type { ActionResult } from "@/types/content";

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("Post not found.");
}

function refresh() {
  revalidatePublicSite();
  revalidatePath("/admin/blog");
}

function publishFields(status: PostStatus, publishAt: Date | null, currentPublishedAt: Date | null | undefined) {
  if (status === "published") return { publishAt: null, publishedAt: currentPublishedAt ?? new Date() };
  if (status === "scheduled") return { publishAt, publishedAt: publishAt };
  return { publishAt, publishedAt: currentPublishedAt ?? null };
}

export async function savePost(id: string | null, input: PostInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = postSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    if (id) assertId(id);

    const conflict = await findSlugConflict(Post, data.slug, id ?? undefined);
    if (conflict) {
      throw new ActionError("That slug is already taken.", {
        slug: [`Already used by “${conflict.title ?? conflict.slug}” (or one of its redirects)`],
      });
    }

    const publishAt = data.publishAt ? new Date(data.publishAt) : null;
    const base = { ...data, readingMinutes: readingMinutes(data.content) };
    let postId: string;
    if (id) {
      const existing = await Post.findById(id);
      if (!existing) throw new ActionError("Post not found.");
      existing.set({
        ...base,
        ...publishFields(data.status, publishAt, existing.publishedAt),
        previousSlugs: nextPreviousSlugs({ slug: existing.slug, previousSlugs: [...existing.previousSlugs] }, data.slug),
      });
      await existing.save();
      postId = existing._id.toString();
    } else {
      const created = await Post.create({ ...base, ...publishFields(data.status, publishAt, null) });
      postId = created._id.toString();
    }

    await logActivity(actor, id ? "post.update" : "post.create", {
      entityType: "post",
      entityId: postId,
      summary: `${id ? "Updated" : "Created"} post “${data.title}” (${data.status})`,
      ip,
    });
    refresh();
    revalidatePath(`/admin/blog/${postId}`);
    return {
      ok: true,
      data: { id: postId },
      message: data.status === "scheduled" ? "Post scheduled" : id ? "Post saved" : "Post created",
    };
  });
}

export async function setPostStatus(id: string, status: PostStatus): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    if (!POST_STATUSES.includes(status) || status === "scheduled") throw new ActionError("Use the editor to schedule a post.");
    const post = await Post.findById(id);
    if (!post) throw new ActionError("Post not found.");
    if (status === "published" && post.content.trim().length < 20) {
      throw new ActionError("Write some content before publishing.");
    }
    post.set({ status, ...publishFields(status, post.publishAt ?? null, post.publishedAt) });
    await post.save();
    await logActivity(actor, `post.${status}`, { entityType: "post", entityId: id, summary: `Set “${post.title}” to ${status}`, ip });
    refresh();
    return { ok: true, message: `Post ${status}` };
  });
}

export async function duplicatePost(id: string): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    assertId(id);
    const source = await Post.findById(id).lean();
    if (!source) throw new ActionError("Post not found.");
    const copy = await Post.create({
      ...omit(source as typeof source & { createdAt?: Date; updatedAt?: Date }, ["_id", "createdAt", "updatedAt"]),
      title: `${source.title} (copy)`.slice(0, 160),
      slug: await uniqueCopySlug(Post, source.slug),
      previousSlugs: [],
      status: "draft",
      publishAt: null,
      publishedAt: null,
      viewCount: 0,
    });
    await logActivity(actor, "post.duplicate", { entityType: "post", entityId: copy._id.toString(), summary: `Duplicated “${source.title}”`, ip });
    refresh();
    return { ok: true, data: { id: copy._id.toString() }, message: "Draft copy created" };
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const post = await Post.findByIdAndDelete(id).lean();
    if (!post) throw new ActionError("Post not found.");
    await logActivity(actor, "post.delete", { entityType: "post", entityId: id, summary: `Deleted post “${post.title}”`, ip });
    refresh();
    return { ok: true, message: "Post deleted" };
  });
}

"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { Page } from "@/lib/db/models";
import { findSlugConflict, nextPreviousSlugs } from "@/lib/services/content";
import { pageSchema, type PageInput } from "@/lib/validation/content";
import type { ActionResult } from "@/types/content";

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("Page not found.");
}

function refresh() {
  revalidatePublicSite();
  revalidatePath("/admin/pages");
}

export async function savePage(id: string | null, input: PageInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = pageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    if (id) assertId(id);

    const conflict = await findSlugConflict(Page, data.slug, id ?? undefined);
    if (conflict) throw new ActionError("That URL is already taken.", { slug: [`Already used by “${conflict.title ?? conflict.slug}”`] });

    let pageId: string;
    if (id) {
      const existing = await Page.findById(id);
      if (!existing) throw new ActionError("Page not found.");
      existing.set({
        ...data,
        previousSlugs: nextPreviousSlugs({ slug: existing.slug, previousSlugs: [...existing.previousSlugs] }, data.slug),
        publishedAt: data.status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
      });
      await existing.save();
      pageId = existing._id.toString();
    } else {
      const created = await Page.create({ ...data, publishedAt: data.status === "published" ? new Date() : null });
      pageId = created._id.toString();
    }

    await logActivity(actor, id ? "page.update" : "page.create", {
      entityType: "page",
      entityId: pageId,
      summary: `${id ? "Updated" : "Created"} page “${data.title}” (/${data.slug}, ${data.status})`,
      ip,
    });
    refresh();
    revalidatePath(`/admin/pages/${pageId}`);
    return { ok: true, data: { id: pageId }, message: id ? "Page saved" : "Page created" };
  });
}

export async function setPageStatus(id: string, status: ProjectStatus): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    if (!PROJECT_STATUSES.includes(status)) throw new ActionError("Invalid status.");
    const page = await Page.findById(id);
    if (!page) throw new ActionError("Page not found.");
    page.status = status;
    if (status === "published" && !page.publishedAt) page.publishedAt = new Date();
    await page.save();
    await logActivity(actor, `page.${status}`, { entityType: "page", entityId: id, summary: `Set page “${page.title}” to ${status}`, ip });
    refresh();
    return { ok: true, message: status === "published" ? "Page published" : status === "archived" ? "Page archived" : "Page moved to drafts" };
  });
}

export async function deletePage(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const page = await Page.findByIdAndDelete(id).lean();
    if (!page) throw new ActionError("Page not found.");
    await logActivity(actor, "page.delete", { entityType: "page", entityId: id, summary: `Deleted page “${page.title}” (/${page.slug})`, ip });
    refresh();
    return { ok: true, message: "Page deleted" };
  });
}

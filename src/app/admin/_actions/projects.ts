"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { Project } from "@/lib/db/models";
import { applyOrder, findSlugConflict, nextOrder, nextPreviousSlugs, uniqueCopySlug } from "@/lib/services/content";
import { projectSchema, type ProjectInput } from "@/lib/validation/content";
import { omit } from "@/lib/utils";
import type { ActionResult } from "@/types/content";

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("Project not found.");
}

function refresh() {
  revalidatePublicSite();
  revalidatePath("/admin/projects");
}

export async function saveProject(id: string | null, input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    if (id) assertId(id);

    const conflict = await findSlugConflict(Project, data.slug, id ?? undefined);
    if (conflict) {
      throw new ActionError("That slug is already taken.", {
        slug: [`Already used by “${conflict.title ?? conflict.slug}” (or one of its redirects)`],
      });
    }

    let projectId: string;
    if (id) {
      const existing = await Project.findById(id);
      if (!existing) throw new ActionError("Project not found.");
      existing.set({
        ...data,
        order: existing.order,
        previousSlugs: nextPreviousSlugs({ slug: existing.slug, previousSlugs: [...existing.previousSlugs] }, data.slug),
        publishedAt: data.status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
      });
      await existing.save();
      projectId = existing._id.toString();
    } else {
      const created = await Project.create({
        ...data,
        order: await nextOrder(Project),
        publishedAt: data.status === "published" ? new Date() : null,
      });
      projectId = created._id.toString();
    }

    await logActivity(actor, id ? "project.update" : "project.create", {
      entityType: "project",
      entityId: projectId,
      summary: `${id ? "Updated" : "Created"} project “${data.title}” (${data.status})`,
      ip,
    });
    refresh();
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true, data: { id: projectId }, message: id ? "Project saved" : "Project created" };
  });
}

export async function duplicateProject(id: string): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    assertId(id);
    const source = await Project.findById(id).lean();
    if (!source) throw new ActionError("Project not found.");
    const copy = await Project.create({
      ...omit(source as typeof source & { createdAt?: Date; updatedAt?: Date }, ["_id", "createdAt", "updatedAt"]),
      title: `${source.title} (copy)`.slice(0, 160),
      slug: await uniqueCopySlug(Project, source.slug),
      previousSlugs: [],
      status: "draft",
      featured: false,
      publishedAt: null,
      viewCount: 0,
      order: await nextOrder(Project),
    });
    await logActivity(actor, "project.duplicate", {
      entityType: "project",
      entityId: copy._id.toString(),
      summary: `Duplicated “${source.title}”`,
      ip,
    });
    refresh();
    return { ok: true, data: { id: copy._id.toString() }, message: "Draft copy created" };
  });
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    if (!PROJECT_STATUSES.includes(status)) throw new ActionError("Invalid status.");
    const project = await Project.findById(id);
    if (!project) throw new ActionError("Project not found.");
    project.status = status;
    if (status === "published" && !project.publishedAt) project.publishedAt = new Date();
    await project.save();
    await logActivity(actor, `project.${status}`, {
      entityType: "project",
      entityId: id,
      summary: `Set “${project.title}” to ${status}`,
      ip,
    });
    refresh();
    return { ok: true, message: `Project ${status === "published" ? "published" : status === "archived" ? "archived" : "moved to drafts"}` };
  });
}

export async function toggleProjectFeatured(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const project = await Project.findById(id);
    if (!project) throw new ActionError("Project not found.");
    project.featured = !project.featured;
    await project.save();
    await logActivity(actor, "project.feature", {
      entityType: "project",
      entityId: id,
      summary: `${project.featured ? "Featured" : "Unfeatured"} “${project.title}”`,
      ip,
    });
    refresh();
    return { ok: true, message: project.featured ? "Shown on the homepage" : "Removed from the homepage" };
  });
}

/** Drag-and-drop reorder: `ids` is the new order of the projects shown in the list. */
export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && Types.ObjectId.isValid(id))) {
      throw new ActionError("Invalid order.");
    }
    if (!(await applyOrder(Project, ids))) return { ok: false, error: "The list changed in the meantime — refresh and try again." };
    await logActivity(actor, "project.reorder", { entityType: "project", summary: "Reordered projects", ip });
    refresh();
    return { ok: true, message: "Order saved" };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const project = await Project.findByIdAndDelete(id).lean();
    if (!project) throw new ActionError("Project not found.");
    await logActivity(actor, "project.delete", {
      entityType: "project",
      entityId: id,
      summary: `Deleted project “${project.title}”`,
      ip,
    });
    refresh();
    return { ok: true, message: "Project deleted" };
  });
}

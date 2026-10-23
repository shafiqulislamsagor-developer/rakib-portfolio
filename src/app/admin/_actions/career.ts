"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { ActionError, adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/constants";
import { Education, Experience, Faq, Service, Skill, Testimonial } from "@/lib/db/models";
import type { AnyModel } from "@/lib/db/types";
import { monthToDate } from "@/lib/format";
import { applyOrder, nextOrder } from "@/lib/services/content";
import {
  educationSchema,
  experienceSchema,
  faqSchema,
  serviceSchema,
  skillSchema,
  testimonialSchema,
  type EducationInput,
  type ExperienceInput,
  type FaqInput,
  type ServiceInput,
  type SkillInput,
  type TestimonialInput,
} from "@/lib/validation/content";
import { omit } from "@/lib/utils";
import type { ActionResult } from "@/types/content";

// Ordered content lists (skills, experience, education, services, testimonials,
// FAQs) share the same save / reorder / archive / delete mechanics.
const COLLECTIONS = {
  skill: { model: Skill as AnyModel, label: "Skill", path: "/admin/skills", nameField: "name" },
  experience: { model: Experience as AnyModel, label: "Experience", path: "/admin/experience", nameField: "title" },
  education: { model: Education as AnyModel, label: "Entry", path: "/admin/education", nameField: "title" },
  service: { model: Service as AnyModel, label: "Service", path: "/admin/services", nameField: "title" },
  testimonial: { model: Testimonial as AnyModel, label: "Testimonial", path: "/admin/testimonials", nameField: "name" },
  faq: { model: Faq as AnyModel, label: "Question", path: "/admin/faqs", nameField: "question" },
} as const;
export type CollectionKind = keyof typeof COLLECTIONS;
type Kind = CollectionKind;

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ActionError("Item not found.");
}

function refresh(kind: Kind) {
  revalidatePublicSite();
  revalidatePath(COLLECTIONS[kind].path);
}

async function upsert(kind: Kind, id: string | null, data: Record<string, unknown>, actor: { id: string; email: string }, ip: string, title: string) {
  const { model, label } = COLLECTIONS[kind];
  let itemId: string;
  if (id) {
    assertId(id);
    const updated = await model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select("_id").lean<{ _id: Types.ObjectId }>();
    if (!updated) throw new ActionError(`${label} not found.`);
    itemId = updated._id.toString();
  } else {
    const created = await model.create({ ...data, order: await nextOrder(model) });
    itemId = created._id.toString();
  }
  await logActivity(actor, `${kind}.${id ? "update" : "create"}`, {
    entityType: kind,
    entityId: itemId,
    summary: `${id ? "Updated" : "Added"} ${label.toLowerCase()} “${title}”`,
    ip,
  });
  refresh(kind);
  return itemId;
}

export async function saveSkill(id: string | null, input: SkillInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = skillSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = omit(parsed.data, ["order"]);
    const itemId = await upsert("skill", id, data, actor, ip, data.name);
    return { ok: true, data: { id: itemId }, message: id ? "Skill updated" : "Skill added" };
  });
}

export async function saveExperience(id: string | null, input: ExperienceInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = experienceSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const rest = omit(parsed.data, ["order"]);
    const data = {
      ...rest,
      startDate: monthToDate(rest.startDate),
      endDate: monthToDate(rest.endDate),
      achievements: rest.achievements.filter(Boolean),
      progression: rest.progression.map((step) => ({
        title: step.title,
        startDate: monthToDate(step.startDate),
        endDate: monthToDate(step.endDate),
      })),
    };
    const itemId = await upsert("experience", id, data, actor, ip, `${rest.title} at ${rest.company}`);
    return { ok: true, data: { id: itemId }, message: id ? "Experience saved" : "Experience added" };
  });
}

export async function saveEducation(id: string | null, input: EducationInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = educationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const rest = omit(parsed.data, ["order"]);
    const data = { ...rest, startDate: monthToDate(rest.startDate), endDate: monthToDate(rest.endDate) };
    const itemId = await upsert("education", id, data, actor, ip, rest.title);
    return { ok: true, data: { id: itemId }, message: id ? "Entry saved" : "Entry added" };
  });
}

export async function saveService(id: string | null, input: ServiceInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = { ...omit(parsed.data, ["order"]), deliverables: parsed.data.deliverables.filter(Boolean) };
    const itemId = await upsert("service", id, data, actor, ip, data.title);
    return { ok: true, data: { id: itemId }, message: id ? "Service saved" : "Service added" };
  });
}

export async function saveTestimonial(id: string | null, input: TestimonialInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = omit(parsed.data, ["order"]);
    const itemId = await upsert("testimonial", id, data, actor, ip, data.name);
    return { ok: true, data: { id: itemId }, message: id ? "Testimonial saved" : "Testimonial added" };
  });
}

export async function saveFaq(id: string | null, input: FaqInput): Promise<ActionResult<{ id: string }>> {
  return adminAction<{ id: string }>(async ({ actor, ip }) => {
    const parsed = faqSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = omit(parsed.data, ["order"]);
    const itemId = await upsert("faq", id, data, actor, ip, data.question);
    return { ok: true, data: { id: itemId }, message: id ? "Question saved" : "Question added" };
  });
}

/** Drag-and-drop reorder: `ids` is the new order of the items shown in the list. */
export async function reorderCareerItems(kind: Kind, ids: string[]): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!(kind in COLLECTIONS)) throw new ActionError("Unknown list.");
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && Types.ObjectId.isValid(id))) {
      throw new ActionError("Invalid order.");
    }
    if (!(await applyOrder(COLLECTIONS[kind].model, ids))) {
      return { ok: false, error: "The list changed in the meantime — refresh and try again." };
    }
    await logActivity(actor, `${kind}.reorder`, { entityType: kind, summary: `Reordered ${COLLECTIONS[kind].label.toLowerCase()} list`, ip });
    refresh(kind);
    return { ok: true, message: "Order saved" };
  });
}

export async function setCareerItemStatus(kind: Kind, id: string, status: ItemStatus): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!(kind in COLLECTIONS) || !ITEM_STATUSES.includes(status)) throw new ActionError("Invalid request.");
    assertId(id);
    const { model, label, nameField } = COLLECTIONS[kind];
    const item = await model.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean<Record<string, unknown>>();
    if (!item) throw new ActionError(`${label} not found.`);
    await logActivity(actor, `${kind}.${status === "archived" ? "archive" : "restore"}`, {
      entityType: kind,
      entityId: id,
      summary: `${status === "archived" ? "Archived" : "Restored"} “${String(item[nameField] ?? "")}”`,
      ip,
    });
    refresh(kind);
    return { ok: true, message: status === "archived" ? `${label} archived (hidden from the site)` : `${label} restored` };
  });
}

export async function toggleSkillFeatured(id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    assertId(id);
    const skill = await Skill.findById(id);
    if (!skill) throw new ActionError("Skill not found.");
    skill.featured = !skill.featured;
    await skill.save();
    await logActivity(actor, "skill.feature", { entityType: "skill", entityId: id, summary: `${skill.featured ? "Featured" : "Unfeatured"} “${skill.name}”`, ip });
    refresh("skill");
    return { ok: true, message: skill.featured ? "Skill highlighted" : "Highlight removed" };
  });
}

export async function deleteCareerItem(kind: Kind, id: string): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    if (!(kind in COLLECTIONS)) throw new ActionError("Unknown list.");
    assertId(id);
    const { model, label, nameField } = COLLECTIONS[kind];
    const item = await model.findByIdAndDelete(id).lean<Record<string, unknown>>();
    if (!item) throw new ActionError(`${label} not found.`);
    await logActivity(actor, `${kind}.delete`, { entityType: kind, entityId: id, summary: `Deleted “${String(item[nameField] ?? "")}”`, ip });
    refresh(kind);
    return { ok: true, message: `${label} deleted` };
  });
}

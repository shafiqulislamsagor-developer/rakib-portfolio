"use server";

import { revalidatePath } from "next/cache";
import { adminAction, invalid, revalidatePublicSite } from "@/lib/admin/action";
import { logActivity } from "@/lib/audit";
import { Profile, Settings } from "@/lib/db/models";
import { invalidateRuntimeConfig } from "@/lib/db/runtime-cache";
import {
  processSchema,
  profileSchema,
  resumeSettingsSchema,
  seoSettingsSchema,
  siteSettingsSchema,
  type ProcessInput,
  type ProfileInput,
  type ResumeSettingsInput,
  type SeoSettingsInput,
  type SiteSettingsInput,
} from "@/lib/validation/content";
import { getThemePreset } from "@/lib/theme";
import type { ActionResult } from "@/types/content";

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    const current = await Profile.findOne({ key: "main" }).select("cv").lean();
    const cvChanged = (current?.cv?.url ?? "") !== data.cv.url;
    await Profile.updateOne(
      { key: "main" },
      {
        $set: {
          ...data,
          heroCode: { ...data.heroCode, craft: data.heroCode.craft.filter(Boolean) },
          cv: { ...data.cv, updatedAt: cvChanged ? new Date() : current?.cv?.updatedAt ?? null },
        },
      },
      { upsert: true, runValidators: true }
    );
    await logActivity(actor, "profile.update", { entityType: "profile", summary: cvChanged ? "Updated profile and CV" : "Updated profile", ip });
    revalidatePublicSite();
    revalidatePath("/admin/profile");
    return { ok: true, message: "Profile saved" };
  });
}

export async function saveSiteSettings(input: SiteSettingsInput): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const parsed = siteSettingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const previous = await Settings.findOne({ key: "main" }).select("theme").lean();
    const previousPreset = getThemePreset(previous?.theme?.preset).label;
    const nextPreset = getThemePreset(parsed.data.theme.preset).label;
    await Settings.updateOne({ key: "main" }, { $set: parsed.data }, { upsert: true, runValidators: true });
    // The analytics time zone is cached for the process; drop it so the new one applies at once.
    invalidateRuntimeConfig();
    await logActivity(actor, "settings.update", {
      entityType: "settings",
      summary: previousPreset !== nextPreset ? `Updated website settings (colour theme: ${previousPreset} → ${nextPreset})` : "Updated website settings",
      ip,
    });
    revalidatePublicSite();
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Settings saved" };
  });
}

export async function saveSeoSettings(input: SeoSettingsInput): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const parsed = seoSettingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { seo, pages } = parsed.data;
    await Settings.updateOne(
      { key: "main" },
      { $set: { seo: { ...seo, twitterHandle: seo.twitterHandle.replace(/^@/, "") }, pages } },
      { upsert: true, runValidators: true }
    );
    await logActivity(actor, "seo.update", {
      entityType: "settings",
      summary: seo.allowIndexing ? "Updated SEO settings" : "Updated SEO settings (indexing disabled)",
      ip,
    });
    revalidatePublicSite();
    revalidatePath("/admin/seo");
    return { ok: true, message: "SEO settings saved" };
  });
}

/** Manually purge cached public pages (e.g. after changing data directly in the database). */
export async function revalidateSiteNow(): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    revalidatePublicSite();
    await logActivity(actor, "site.revalidate", { entityType: "settings", summary: "Refreshed cached public pages", ip });
    return { ok: true, message: "Public pages will refresh on the next visit" };
  });
}

export async function saveProcess(input: ProcessInput): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const parsed = processSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await Settings.updateOne({ key: "main" }, { $set: { process: parsed.data.process } }, { upsert: true, runValidators: true });
    await logActivity(actor, "settings.process", { entityType: "settings", summary: `Updated the work process (${parsed.data.process.length} steps)`, ip });
    revalidatePublicSite();
    revalidatePath("/admin/services");
    return { ok: true, message: "Process saved" };
  });
}

export async function saveResumeSettings(input: ResumeSettingsInput): Promise<ActionResult> {
  return adminAction(async ({ actor, ip }) => {
    const parsed = resumeSettingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { resume } = parsed.data;
    await Settings.updateOne({ key: "main" }, { $set: { resume } }, { upsert: true, runValidators: true });
    const shown = resume.sections.filter((section) => section.visible).length;
    await logActivity(actor, "resume.update", {
      entityType: "settings",
      summary: `Updated the résumé (${resume.template} layout, ${shown} of ${resume.sections.length} sections shown)`,
      ip,
    });
    revalidatePublicSite();
    revalidatePath("/admin/resume");
    return { ok: true, message: "Résumé saved" };
  });
}

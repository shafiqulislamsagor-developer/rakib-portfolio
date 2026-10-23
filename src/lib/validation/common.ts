import { z } from "zod";

export const text = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const requiredText = (min: number, max: number, label = "This field") =>
  z
    .string()
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;
const IMAGE_URL = /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i;

/** Link targets rendered in `href` attributes. Blocks `javascript:` and other schemes. */
export const safeHref = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || SAFE_HREF.test(value), "Use https://…, /path, #anchor, mailto: or tel:");

/** Absolute http(s) URL or empty. */
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || HTTP_URL.test(value), "Enter a full URL starting with https://");

/** Absolute http(s) URL or a site-relative path. */
export const assetUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || IMAGE_URL.test(value), "Enter an https:// URL or a /path");

export const imageAssetSchema = z.object({
  url: assetUrl,
  alt: text(300),
});

export const seoSchema = z.object({
  title: text(120),
  description: text(320),
  ogImage: assetUrl,
  noIndex: z.boolean(),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(120, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const stringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems, `Up to ${maxItems} items`);

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

/** `YYYY-MM` from <input type="month">. */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month");
export const optionalMonthSchema = z.union([monthSchema, z.literal("")]);

export const orderSchema = z.number().int().min(0).max(100000);

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

/** Field errors keyed by dot path (e.g. `seo.title`, `gallery.0.url`) so forms can map them back. */
export function zodFieldErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

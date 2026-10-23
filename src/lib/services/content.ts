import type { Types } from "mongoose";
import type { AnyModel } from "@/lib/db/types";
import { Education, Experience, Page, Post, Profile, Project, Settings, Skill, Testimonial } from "@/lib/db/models";

type Ordered = { _id: Types.ObjectId; order?: number | null };

/**
 * Move a document one position up or down within its list. Orders are
 * re-indexed (0..n-1) first so duplicate or sparse values cannot break it.
 */
export async function moveInOrder(
  model: AnyModel,
  id: string,
  direction: "up" | "down",
  scope: Record<string, unknown> = {}
) {
  const docs = (await model.find(scope).sort({ order: 1, _id: 1 }).select("_id order").lean()) as Ordered[];
  const index = docs.findIndex((doc) => doc._id.toString() === id);
  if (index === -1) return false;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= docs.length) return false;
  [docs[index], docs[target]] = [docs[target], docs[index]];
  await model.bulkWrite(
    docs.map((doc, position) => ({
      updateOne: { filter: { _id: doc._id }, update: { $set: { order: position } } },
    }))
  );
  return true;
}

/**
 * Save a drag-and-drop order. `ids` is the new order of the items the admin was
 * looking at — possibly a filtered or paginated slice. Those items are shuffled
 * among the slots they already occupy in the full list, so nothing outside the
 * slice moves. Returns false when `ids` no longer matches the stored items.
 */
export async function applyOrder(model: AnyModel, ids: string[], scope: Record<string, unknown> = {}) {
  if (!ids.length || new Set(ids).size !== ids.length) return false;
  const docs = (await model.find(scope).sort({ order: 1, _id: 1 }).select("_id order").lean()) as Ordered[];
  const wanted = new Set(ids);
  const slots = docs.flatMap((doc, index) => (wanted.has(doc._id.toString()) ? [index] : []));
  if (slots.length !== ids.length) return false;
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));
  const next = [...docs];
  slots.forEach((slot, position) => {
    next[slot] = byId.get(ids[position])!;
  });
  await model.bulkWrite(
    next.map((doc, position) => ({
      updateOne: { filter: { _id: doc._id }, update: { $set: { order: position } } },
    }))
  );
  return true;
}

export async function nextOrder(model: AnyModel, scope: Record<string, unknown> = {}) {
  const last = (await model.findOne(scope).sort({ order: -1 }).select("order").lean()) as Ordered | null;
  return (last?.order ?? -1) + 1;
}

/** A slug is free when no other document uses it as its slug or as a redirect source. */
export async function findSlugConflict(model: AnyModel, slug: string, excludeId?: string) {
  return model
    .findOne({
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      $or: [{ slug }, { previousSlugs: slug }],
    })
    .select("title slug")
    .lean() as Promise<{ title?: string; slug: string } | null>;
}

/** Keep old slugs as permanent redirects when a slug changes. */
export function nextPreviousSlugs(current: { slug: string; previousSlugs?: string[] }, newSlug: string) {
  const history = new Set(current.previousSlugs ?? []);
  if (current.slug && current.slug !== newSlug) history.add(current.slug);
  history.delete(newSlug);
  return [...history].slice(-20);
}

export async function uniqueCopySlug(model: AnyModel, base: string) {
  const stem = `${base.replace(/-copy(-\d+)?$/, "")}-copy`.slice(0, 110);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? stem : `${stem}-${attempt + 1}`;
    if (!(await findSlugConflict(model, candidate))) return candidate;
  }
  return `${stem}-${Date.now()}`;
}

export type MediaUsage = { type: string; label: string; href: string; published: boolean };

/** Where a stored file URL is referenced, so deleting it cannot silently break live pages. */
export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inText = new RegExp(escaped);
  const usage: MediaUsage[] = [];

  const projects = await Project.find({
    $or: [{ "thumbnail.url": url }, { "cover.url": url }, { "gallery.url": url }, { "seo.ogImage": url }, { content: inText }],
  })
    .select("title status")
    .lean();
  for (const project of projects) {
    usage.push({ type: "Project", label: project.title, href: `/admin/projects/${project._id}`, published: project.status === "published" });
  }

  const posts = await Post.find({ $or: [{ "coverImage.url": url }, { "seo.ogImage": url }, { content: inText }] })
    .select("title status")
    .lean();
  for (const post of posts) {
    usage.push({
      type: "Blog post",
      label: post.title,
      href: `/admin/blog/${post._id}`,
      published: post.status === "published" || post.status === "scheduled",
    });
  }

  const pages = await Page.find({ $or: [{ "seo.ogImage": url }, { content: inText }] }).select("title status").lean();
  for (const page of pages) {
    usage.push({ type: "Page", label: page.title, href: `/admin/pages/${page._id}`, published: page.status === "published" });
  }

  const testimonials = await Testimonial.find({ "avatar.url": url }).select("name status").lean();
  for (const item of testimonials) {
    usage.push({ type: "Testimonial", label: item.name, href: `/admin/testimonials/${item._id}`, published: item.status === "active" });
  }

  if (await Profile.exists({ $or: [{ "avatar.url": url }, { "cv.url": url }, { bio: inText }] })) {
    usage.push({ type: "Profile", label: "Profile (avatar, CV or bio)", href: "/admin/profile", published: true });
  }
  if (
    await Settings.exists({
      $or: [
        { "logo.url": url },
        { faviconUrl: url },
        { "seo.ogImage": url },
        ...["projects", "blog", "about", "services", "contact", "resume"].map((key) => ({ [`pages.${key}.ogImage`]: url })),
      ],
    })
  ) {
    usage.push({ type: "Settings", label: "Site settings / SEO", href: "/admin/settings", published: true });
  }
  return usage;
}

export const orderedModels = { Project, Skill, Experience, Education };

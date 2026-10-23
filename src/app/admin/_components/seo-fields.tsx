"use client";

import { useFormContext } from "react-hook-form";
import { SwitchField, TextAreaField, TextField } from "./fields";
import { FileUrlField } from "./media-field";

export function SearchPreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-[4px] border border-border bg-background p-4" aria-label="Search result preview">
      <p className="truncate text-xs text-muted-foreground">{url}</p>
      <p className="mt-1 line-clamp-1 text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8]">{title || "Untitled"}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description || "No description yet — search engines will pick text from the page."}</p>
    </div>
  );
}

/** SEO override fields for an item, with a live search preview. Falls back to the item's own title/summary. */
export function SeoFields({
  prefix = "seo",
  fallbackTitle,
  fallbackDescription,
  url,
}: {
  prefix?: string;
  fallbackTitle: string;
  fallbackDescription: string;
  url: string;
}) {
  const { watch } = useFormContext();
  const title = (watch(`${prefix}.title`) as string) || fallbackTitle;
  const description = (watch(`${prefix}.description`) as string) || fallbackDescription;
  return (
    <div className="space-y-4">
      <SearchPreview title={title} description={description.slice(0, 160)} url={url} />
      <TextField name={`${prefix}.title`} label="Meta title" placeholder={fallbackTitle} maxLength={120} hint="Leave empty to use the title. Aim for under 60 characters." />
      <TextAreaField name={`${prefix}.description`} label="Meta description" rows={3} maxLength={320} placeholder={fallbackDescription.slice(0, 160)} hint="Leave empty to use the summary. Aim for 120–160 characters." />
      <FileUrlField name={`${prefix}.ogImage`} label="Social share image" accept="image" hint="1200×630 recommended. Defaults to the cover image." />
      <SwitchField name={`${prefix}.noIndex`} label="Hide from search engines" description="Adds noindex and removes the page from the sitemap." />
    </div>
  );
}

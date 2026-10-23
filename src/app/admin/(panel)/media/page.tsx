import { FilterTabs, PageHeader, Pagination, SearchBox, buildHref } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { pageFromParam, paginate, param, searchRegex } from "@/lib/admin/paginate";
import { Media } from "@/lib/db/models";
import { toMedia } from "@/lib/db/serialize";
import { formatBytes } from "@/lib/format";
import { mediaStorageUsage } from "@/lib/storage";
import type { Metadata } from "next";
import MediaGrid from "./media-grid";
import { ImageIcon } from "lucide-react";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const params = await searchParams;
  const type = param(params.type);
  const q = param(params.q);
  const page = pageFromParam(params.page);
  const filter = {
    ...(type === "image"
      ? { resourceType: "image" }
      : type === "document"
        ? { resourceType: "raw" }
        : type === "audio"
          ? { resourceType: "audio" }
          : {}),
    ...(q ? { $or: [{ originalName: searchRegex(q) }, { alt: searchRegex(q) }, { caption: searchRegex(q) }] } : {}),
  };
  const [result, images, documents, audioFiles, usage] = await Promise.all([
    paginate(Media, filter, { page, pageSize: 30, sort: { createdAt: -1 }, map: toMedia }),
    Media.countDocuments({ resourceType: "image" }),
    Media.countDocuments({ resourceType: "raw" }),
    Media.countDocuments({ resourceType: "audio" }),
    mediaStorageUsage(),
  ]);

  return (
    <>
      <PageHeader icon={ImageIcon}
        title="Media library"
        description="Images, audio clips and documents used across the site. JPEG, PNG, WebP, GIF, AVIF, MP3, M4A, WAV and PDF up to 4 MB."
      />
      <p className="mb-6 rounded-[4px] border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Files are stored inside your MongoDB database and served from <code>/media/…</code> with long-lived caching.
        Currently using <strong className="text-foreground">{formatBytes(usage.bytes)}</strong> for {usage.files} file(s) — free Atlas clusters
        allow 512 MB in total, so compress large images before uploading.
      </p>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          items={[
            { label: "All", href: buildHref("/admin/media", { q }), active: !type, count: images + documents + audioFiles },
            { label: "Images", href: buildHref("/admin/media", { type: "image", q }), active: type === "image", count: images },
            { label: "Audio", href: buildHref("/admin/media", { type: "audio", q }), active: type === "audio", count: audioFiles },
            { label: "Documents", href: buildHref("/admin/media", { type: "document", q }), active: type === "document", count: documents },
          ]}
        />
        <SearchBox action="/admin/media" defaultValue={q} placeholder="Search files…" hidden={{ type }} />
      </div>
      <MediaGrid items={result.items} uploadsEnabled />
      <Pagination page={result.page} pageCount={result.pageCount} total={result.total} href={(target) => buildHref("/admin/media", { type, q, page: target })} />
    </>
  );
}

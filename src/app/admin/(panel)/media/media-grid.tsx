"use client";

import { deleteMedia, getMediaUsage, replaceMediaReferences, updateMediaMeta } from "@/app/admin/_actions/media";
import { uploadToLibrary } from "@/app/admin/_components/media-field";
import { EmptyState } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaUsage } from "@/lib/services/content";
import type { MediaData } from "@/types/content";
import { AudioLines, Copy, FileText, ImageIcon, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function Dropzone({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setProgress({ done: 0, total: files.length });
    let failures = 0;
    for (const [index, file] of files.entries()) {
      try {
        await uploadToLibrary(file, "any");
      } catch (error) {
        failures += 1;
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
      }
      setProgress({ done: index + 1, total: files.length });
    }
    setProgress(null);
    if (failures < files.length) toast.success(`Uploaded ${files.length - failures} file(s)`);
    router.refresh();
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (enabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (enabled) void upload([...event.dataTransfer.files]);
      }}
      className={cn(
        "mb-6 grid place-items-center rounded-[4px] border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
        !enabled && "opacity-50"
      )}
    >
      <UploadCloud className="size-7 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{progress ? `Uploading ${progress.done}/${progress.total}…` : "Drag files here"}</p>
      <p className="mt-1 text-xs text-muted-foreground">or</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          void upload(files);
        }}
      />
      <Button type="button" variant="outline" size="sm" className="mt-3" disabled={!enabled || Boolean(progress)} onClick={() => inputRef.current?.click()}>
        {progress ? <Loader2 className="animate-spin" /> : null} Choose files
      </Button>
    </div>
  );
}

function MediaDetail({ media, onClose }: { media: MediaData; onClose: () => void }) {
  const router = useRouter();
  const [alt, setAlt] = useState(media.alt);
  const [caption, setCaption] = useState(media.caption);
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [removeOld, setRemoveOld] = useState(true);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getMediaUsage(media.id).then((result) => setUsage(result.ok ? result.data ?? [] : []));
  }, [media.id]);

  const live = usage?.filter((item) => item.published) ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
      <div className="grid min-h-48 place-items-center overflow-hidden rounded-[4px] border border-border bg-muted/40">
        {media.resourceType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview from storage
          <img src={media.url} alt={media.alt} className="max-h-[50vh] w-auto object-contain" />
        ) : media.resourceType === "audio" ? (
          <div className="flex w-full flex-col items-center gap-4 p-10">
            <AudioLines className="size-10 text-muted-foreground" />
            <audio src={media.url} controls preload="metadata" className="w-full max-w-md" aria-label={media.alt || media.originalName} />
          </div>
        ) : (
          <a href={media.url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-10 text-sm text-primary hover:underline">
            <FileText className="size-10" /> Open PDF
          </a>
        )}
      </div>
      <div className="space-y-4">
        <dl className="space-y-1 text-xs text-muted-foreground">
          <div>{media.originalName || "Unnamed file"}</div>
          <div>
            {media.mimeType} · {formatBytes(media.bytes)}
            {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
          </div>
          <div>
            Uploaded {formatDateTime(media.createdAt)} by {media.uploadedBy || "—"}
          </div>
        </dl>
        <div className="flex gap-2">
          <Input value={media.url} readOnly aria-label="File URL" className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy URL"
            onClick={async () => {
              await navigator.clipboard.writeText(media.url);
              toast.success("URL copied");
            }}
          >
            <Copy />
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="media-alt">Alt text</Label>
          <Input id="media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={300} placeholder="Describe the image for screen readers" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="media-caption">Caption</Label>
          <Textarea id="media-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} rows={2} />
        </div>
        <Button
          size="sm"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("save");
            const result = await updateMediaMeta(media.id, { alt, caption });
            setBusy(null);
            if (result.ok) {
              toast.success("Saved");
              router.refresh();
            } else toast.error(result.error);
          }}
        >
          {busy === "save" && <Loader2 className="animate-spin" />} Save details
        </Button>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Used in</p>
          {usage === null ? (
            <p className="mt-2 text-sm text-muted-foreground">Checking…</p>
          ) : usage.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Not used anywhere.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {usage.map((item) => (
                <li key={`${item.type}-${item.href}`}>
                  <Link href={item.href} className="hover:text-primary">
                    {item.type}: {item.label}
                  </Link>{" "}
                  {item.published && <span className="text-xs text-mist dark:text-mist">(live)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <input
            ref={replaceRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            accept={
              media.resourceType === "image"
                ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
                : media.resourceType === "audio"
                  ? "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
                  : "application/pdf"
            }
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setBusy("replace");
              try {
                const uploaded = await uploadToLibrary(file, media.resourceType === "image" ? "image" : media.resourceType === "audio" ? "audio" : "document", alt);
                const result = await replaceMediaReferences(media.id, uploaded.id, removeOld);
                if (result.ok) {
                  toast.success(result.message ?? "Replaced");
                  onClose();
                  router.refresh();
                } else toast.error(result.error);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Replacement failed");
              } finally {
                setBusy(null);
              }
            }}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={removeOld} onCheckedChange={(value) => setRemoveOld(value === true)} /> Delete this file after replacing
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => replaceRef.current?.click()}>
              {busy === "replace" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Replace everywhere
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy !== null || usage === null || live.length > 0}
              title={live.length ? "Used by published content" : undefined}
              onClick={async () => {
                const drafts = usage?.length ?? 0;
                const message = drafts
                  ? `This file is used by ${drafts} draft item(s). Delete it anyway?`
                  : "Delete this file permanently?";
                if (!window.confirm(message)) return;
                setBusy("delete");
                const result = await deleteMedia(media.id, drafts > 0);
                setBusy(null);
                if (result.ok) {
                  toast.success("File deleted");
                  onClose();
                  router.refresh();
                } else toast.error(result.error);
              }}
            >
              {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
            </Button>
          </div>
          {live.length > 0 && <p className="text-xs text-muted-foreground">Delete is disabled while published content uses this file.</p>}
        </div>
      </div>
    </div>
  );
}

export default function MediaGrid({ items, uploadsEnabled }: { items: MediaData[]; uploadsEnabled: boolean }) {
  const [selected, setSelected] = useState<MediaData | null>(null);

  return (
    <>
      <Dropzone enabled={uploadsEnabled} />
      {items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No files yet" description="Upload images for projects and posts, your CV as a PDF, or an audio file for the voice greeting." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((media) => (
            <li key={media.id}>
              <button
                type="button"
                onClick={() => setSelected(media)}
                className="group w-full overflow-hidden rounded-[4px] border border-border bg-card text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid aspect-square place-items-center overflow-hidden bg-muted/40">
                  {media.resourceType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails from storage
                    <img src={media.url} alt={media.alt} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-105" />
                  ) : media.resourceType === "audio" ? (
                    <AudioLines className="size-8 text-muted-foreground" />
                  ) : (
                    <FileText className="size-8 text-muted-foreground" />
                  )}
                </span>
                <span className="block truncate px-2.5 pt-2 text-xs font-medium">{media.originalName || "Unnamed"}</span>
                <span className="block px-2.5 pb-2 text-[10px] text-muted-foreground">
                  {formatBytes(media.bytes)} {!media.alt && media.resourceType === "image" ? "· no alt text" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>File details</DialogTitle>
            <DialogDescription>Edit alt text, see where the file is used, replace or delete it.</DialogDescription>
          </DialogHeader>
          {selected && <MediaDetail key={selected.id} media={selected} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

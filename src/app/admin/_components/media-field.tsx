"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaData } from "@/types/content";
import { AudioLines, FileText, ImageIcon, Library, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Field, useFieldError } from "./fields";

type Accept = "image" | "document" | "audio";

export async function uploadToLibrary(file: File, accept: Accept | "any", alt = ""): Promise<MediaData> {
  const body = new FormData();
  body.append("file", file);
  body.append("accept", accept);
  if (alt) body.append("alt", alt);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await response.json().catch(() => ({}))) as { media?: MediaData; error?: string };
  if (!response.ok || !json.media) throw new Error(json.error ?? "Upload failed.");
  return json.media;
}

const ACCEPT_ATTR: Record<Accept, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  document: "application/pdf",
  audio: "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm",
};

function MediaPicker({
  open,
  onOpenChange,
  accept,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accept: Accept;
  onSelect: (media: MediaData) => void;
}) {
  const [items, setItems] = useState<MediaData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/media?type=${accept}&q=${encodeURIComponent(search)}`);
        if (!response.ok) throw new Error();
        const json = (await response.json()) as { items: MediaData[] };
        setItems(json.items);
      } catch {
        setError("Could not load the media library.");
      } finally {
        setLoading(false);
      }
    },
    [accept]
  );

  // Fetch the library when the picker opens, not before: it is a request to an
  // external system, and its result lands through the async handler in `load`.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: fetch on open
    if (open) void load("");
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
          <DialogDescription>Choose a previously uploaded {accept === "image" ? "image" : accept === "audio" ? "audio file" : "document"}.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load(query);
          }}
        >
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by file name or alt text" />
        </form>
        <div className="max-h-[55vh] min-h-48 overflow-y-auto">
          {loading ? (
            <div className="grid h-48 place-items-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No files yet. Upload one from the field instead.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((media) => (
                <li key={media.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(media);
                      onOpenChange(false);
                    }}
                    className="group w-full overflow-hidden rounded-[4px] border border-border text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="grid aspect-square place-items-center bg-muted/50">
                      {media.resourceType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails from arbitrary storage
                        <img src={media.url} alt={media.alt} className="size-full object-cover" loading="lazy" />
                      ) : media.resourceType === "audio" ? (
                        <AudioLines className="size-8 text-muted-foreground" />
                      ) : (
                        <FileText className="size-8 text-muted-foreground" />
                      )}
                    </span>
                    <span className="block truncate px-2 py-1.5 text-xs">{media.originalName || media.url}</span>
                    <span className="block px-2 pb-2 text-[10px] text-muted-foreground">{formatBytes(media.bytes)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadControls({
  accept,
  onUploaded,
  onPicked,
  children,
}: {
  accept: Accept;
  onUploaded: (media: MediaData) => void;
  onPicked: (media: MediaData) => void;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR[accept]}
        className="sr-only"
        tabIndex={-1}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setUploading(true);
          try {
            const media = await uploadToLibrary(file, accept);
            onUploaded(media);
            toast.success("Uploaded");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed");
          } finally {
            setUploading(false);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploading ? "Uploading…" : "Upload"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
        <Library /> Library
      </Button>
      {children}
      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} accept={accept} onSelect={onPicked} />
    </div>
  );
}

/** Preview that says so when the URL does not load, instead of showing a broken image. */
function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="absolute inset-0 grid place-items-center p-2 text-center text-[11px] text-destructive">
        Image could not be loaded — check the URL
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- preview of arbitrary URL
  return <img src={src} alt={alt} className="size-full object-cover" decoding="async" onError={() => setFailed(true)} />;
}

/** Image value `{ url, alt }` with upload, library picker, URL entry and alt text. */
export function ImageField({
  name,
  label,
  hint,
  aspect = "aspect-video",
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  aspect?: string;
}) {
  const { control } = useFormContext();
  const id = useId();
  const urlError = useFieldError(`${name}.url`);
  const altError = useFieldError(`${name}.alt`);
  const error = urlError ?? altError;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value ?? { url: "", alt: "" }) as { url: string; alt: string };
        const set = (patch: Partial<typeof value>) => field.onChange({ ...value, ...patch });
        return (
          <Field label={label} htmlFor={`${id}-url`} hint={hint} error={error}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
              <div className={cn("relative w-full max-w-[14rem] overflow-hidden rounded-[4px] border border-border bg-muted/40 sm:max-w-none", aspect)}>
                {value.url ? (
                  <PreviewImage key={value.url} src={value.url} alt={value.alt} />
                ) : (
                  <span className="absolute inset-0 grid place-items-center gap-1 text-center text-muted-foreground">
                    <span className="grid justify-items-center gap-1">
                      <ImageIcon className="size-6" />
                      <span className="text-[11px]">No image</span>
                    </span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  id={`${id}-url`}
                  value={value.url}
                  onChange={(event) => set({ url: event.target.value })}
                  placeholder="https://… or /image.png"
                  aria-label="Image URL"
                />
                <Input value={value.alt} onChange={(event) => set({ alt: event.target.value })} placeholder="Alt text (describe the image)" aria-label="Alt text" />
                <UploadControls
                  accept="image"
                  onUploaded={(media) => set({ url: media.url, alt: value.alt || media.alt })}
                  onPicked={(media) => set({ url: media.url, alt: value.alt || media.alt })}
                >
                  {value.url && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ url: "" })}>
                      <X /> Remove
                    </Button>
                  )}
                </UploadControls>
              </div>
            </div>
          </Field>
        );
      }}
    />
  );
}

/** Plain URL string field with upload/library support (e.g. CV PDF, OG image, favicon). */
export function FileUrlField({
  name,
  label,
  hint,
  accept,
  onUploaded,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  accept: Accept;
  onUploaded?: (media: MediaData) => void;
}) {
  const { control } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field label={label} htmlFor={id} hint={hint} error={error}>
          <div className="space-y-2">
            <Input
              id={id}
              value={(field.value as string) ?? ""}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={
                accept === "document"
                  ? "https://…/resume.pdf or /resume.pdf"
                  : accept === "audio"
                    ? "https://…/welcome.mp3 or /welcome.mp3"
                    : "https://… or /image.png"
              }
            />
            <UploadControls
              accept={accept}
              onUploaded={(media) => {
                field.onChange(media.url);
                onUploaded?.(media);
              }}
              onPicked={(media) => {
                field.onChange(media.url);
                onUploaded?.(media);
              }}
            >
              {field.value ? (
                <Button asChild variant="ghost" size="sm">
                  <a href={field.value as string} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              ) : null}
            </UploadControls>
          </div>
        </Field>
      )}
    />
  );
}

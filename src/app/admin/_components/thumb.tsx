import SmartImage from "@/components/smart-image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

/** Small optimized preview for admin list rows (never loads the full-size upload). */
export function Thumb({ url, alt, className }: { url?: string; alt?: string; className?: string }) {
  return (
    <span className={cn("relative grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-border bg-muted/50", className)}>
      {url ? (
        <SmartImage src={url} alt={alt ?? ""} fill sizes="64px" className="object-cover object-top" />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground/60" aria-hidden="true" />
      )}
    </span>
  );
}

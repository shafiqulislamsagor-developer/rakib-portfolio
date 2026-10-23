"use client";

import { shouldOptimize } from "@/lib/images";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

type SmartImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string;
  alt: string;
  /** Rendered when the image cannot be loaded at all. Defaults to a muted tile with an icon. */
  fallback?: ReactNode;
};

/**
 * next/image that never leaves a broken picture behind. If the optimized
 * version fails (optimizer timeout, quota, cold database), it retries the
 * original file directly; if that fails too, it renders a placeholder.
 */
export default function SmartImage({ src, alt, unoptimized, fallback, className, fill, ...props }: SmartImageProps) {
  // 0 = optimized, 1 = original file, 2 = gave up
  const [attempt, setAttempt] = useState<0 | 1 | 2>(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  if (src !== currentSrc) {
    setCurrentSrc(src);
    setAttempt(0);
  }

  const direct = Boolean(unoptimized) || !shouldOptimize(src);

  if (!src || attempt === 2) {
    return (
      fallback ?? (
        <span
          role="img"
          aria-label={alt}
          className={cn(
            "grid place-items-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/60",
            fill ? "absolute inset-0" : className
          )}
        >
          <ImageOff className="size-5" aria-hidden="true" />
        </span>
      )
    );
  }

  return (
    <Image
      key={attempt}
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={direct || attempt === 1}
      onError={() => setAttempt(direct || attempt === 1 ? 2 : 1)}
      {...props}
    />
  );
}

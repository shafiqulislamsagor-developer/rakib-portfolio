import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, DownloadIcon } from "./icons";

type Tone = "light" | "dark";

const toneClasses: Record<Tone, { frame: string; fill: string; text: string }> = {
  // light: white outline on dark backgrounds
  light: {
    frame: "border-white",
    fill: "bg-white",
    text: "text-white group-hover:text-ink group-focus-visible:text-ink",
  },
  // dark: black outline on light backgrounds
  dark: {
    frame: "btn-ease border-ink",
    fill: "bg-ink",
    text: "text-ink group-hover:text-white group-focus-visible:text-white",
  },
};

/** Label that slides up while an identical copy rises from below (Atoll CTA hover). */
export function TextSlide({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-slide ${className}`}>
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}

type OutlineButtonProps = {
  label: string;
  href?: string;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  /** solid background behind the outline (used on the CV preview button) */
  surface?: string;
  /** Atoll-style label slide and arrow swap on hover (project page CTAs) */
  slide?: boolean;
};

/** Outline button with an arrow; a solid layer slides in on hover. */
export function OutlineButton({
  label,
  href,
  tone = "light",
  className = "",
  style,
  type = "button",
  onClick,
  disabled = false,
  surface,
  slide = false,
}: OutlineButtonProps) {
  const t = toneClasses[tone];
  const text = "text-[14px] leading-[13.2px] uppercase whitespace-nowrap";
  const inner = (
    <>
      <span aria-hidden className={`btn-fill absolute inset-0 rounded-[4px] ${t.fill}`} />
      <span className={`btn-label relative flex items-center justify-center gap-3 ${t.text}`}>
        {slide ? <TextSlide className={text}>{label}</TextSlide> : <span className={text}>{label}</span>}
        {slide ? (
          <span className="icon-swap shrink-0">
            <ArrowRight />
            <ArrowRight />
          </span>
        ) : (
          <ArrowRight className="btn-arrow shrink-0" />
        )}
      </span>
    </>
  );
  const cls = `group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-[4px] border ${t.frame} ${className}`;
  const st = surface ? { background: surface, ...style } : style;
  if (href) {
    return (
      <Link href={href} className={cls} style={st}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${cls} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
      style={st}
    >
      {inner}
    </button>
  );
}

/** "/     Label" section eyebrow. Spacing inside the string is significant. */
export function Eyebrow({
  children,
  className = "",
  style,
  ...rest
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
} & Record<`data-${string}`, string | undefined>) {
  return (
    <p className={`whitespace-pre uppercase ${className}`} style={style} {...rest}>
      {children}
    </p>
  );
}

/** White 120px disc blended with `difference`, used as a floating call to action. */
export function DiscLink({
  label,
  href,
  className = "",
  style,
}: {
  label: string;
  href: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={href}
      data-reveal="pop"
      className={`group absolute z-10 flex size-[120px] items-center justify-center rounded-full bg-white mix-blend-difference transition-[scale] duration-500 ease-[var(--ease-out-soft)] hover:scale-110 ${className}`}
      style={style}
    >
      <span className="text-[16px] leading-[28px] text-black capitalize whitespace-nowrap">{label}</span>
    </Link>
  );
}

/** "Download CV" text with a circular icon button; the arrow loops on hover. */
export function DownloadCv({
  tone = "light",
  className = "",
  href = "/cv",
}: {
  tone?: Tone;
  className?: string;
  href?: string;
}) {
  const color = tone === "light" ? "text-white" : "text-ink";
  const ring = tone === "light" ? "border-white" : "border-ink";
  return (
    <a href={href} download className={`group inline-flex h-10 items-center gap-[10px] ${color} ${className}`}>
      <span className="trim text-[16px] [--lh:20px] whitespace-nowrap">Download CV</span>
      <span className={`relative flex size-10 items-center justify-center overflow-hidden rounded-full border ${ring}`}>
        <span className="relative block size-4 overflow-hidden">
          <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-4">
            <DownloadIcon />
            <DownloadIcon />
          </span>
        </span>
      </span>
    </a>
  );
}

/** Small bordered tag, e.g. "UI Design". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[4px] border border-[#a0a0a0] p-[7px]">
      <span className="trim text-[12px] tracking-[0.1px] text-g4 [--lh:1.2em] whitespace-nowrap">{children}</span>
    </span>
  );
}

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, DownloadIcon } from "./icons";

type Tone = "light" | "dark";

const toneClasses: Record<Tone, { frame: string; fill: string; text: string }> = {
  // light: white outline on dark backgrounds
  light: {
    frame: "border-white text-white",
    fill: "bg-white",
    text: "group-hover:text-ink group-focus-visible:text-ink",
  },
  // dark: black outline on light backgrounds
  dark: {
    frame: "border-ink text-ink",
    fill: "bg-ink",
    text: "group-hover:text-white group-focus-visible:text-white",
  },
};

type OutlineButtonProps = {
  label: string;
  href?: string;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
  onClick?: () => void;
  /** solid background behind the outline (used on the CV preview button) */
  surface?: string;
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
  surface,
}: OutlineButtonProps) {
  const t = toneClasses[tone];
  const inner = (
    <>
      <span aria-hidden className={`btn-fill absolute inset-0 rounded-[4px] ${t.fill}`} />
      <span
        className={`relative flex items-center justify-center gap-3 transition-colors duration-300 ${t.text}`}
      >
        <span className="text-[14px] leading-[13.2px] uppercase whitespace-nowrap">{label}</span>
        <ArrowRight className="shrink-0" />
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
    <button type={type} onClick={onClick} className={`${cls} cursor-pointer`} style={st}>
      {inner}
    </button>
  );
}

/** "/     Label" section eyebrow. Spacing inside the string is significant. */
export function Eyebrow({
  children,
  className = "",
  style,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={`whitespace-pre uppercase ${className}`} style={style}>
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
      className={`group absolute z-10 flex size-[120px] items-center justify-center rounded-full bg-white mix-blend-difference transition-transform duration-500 ease-[var(--ease-out-soft)] hover:scale-110 ${className}`}
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
  href = "/cv/rakib-khan-cv.pdf",
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

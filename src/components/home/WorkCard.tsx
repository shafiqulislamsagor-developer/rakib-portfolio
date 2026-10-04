"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { Tag } from "../ui";

type WorkCardProps = {
  title: string;
  image: string;
  tags: string[];
  href: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Project card; a "View" disc follows the pointer while hovering the image. */
export function WorkCard({ title, image, tags, href, className = "", style }: WorkCardProps) {
  const frame = useRef<HTMLAnchorElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  function onMove(e: PointerEvent<HTMLAnchorElement>) {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    // the page may be scaled with CSS zoom; convert screen pixels to local ones
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    setCursor({ x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z });
  }

  return (
    <article className={`flex w-[670px] flex-col gap-3 ${className}`} style={style}>
      <Link
        ref={frame}
        href={href}
        aria-label={`View ${title}`}
        onPointerMove={onMove}
        onPointerLeave={() => setCursor(null)}
        className="group relative block h-[520px] w-full cursor-none overflow-hidden rounded-[4px]"
      >
        <Image
          src={image}
          alt=""
          fill
          sizes="670px"
          className="object-fill transition-transform duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 flex size-20 items-center justify-center rounded-full bg-white mix-blend-color-dodge transition-[opacity,scale] duration-300"
          style={{
            translate: cursor ? `${cursor.x - 40}px ${cursor.y - 40}px` : "495px 520px",
            opacity: cursor ? 1 : 0,
            scale: cursor ? "1" : "0.6",
          }}
        >
          <span className="trim text-[16px] tracking-[0.1px] text-ink [--lh:1.2em]">View</span>
        </span>
      </Link>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <h3 className="trim text-[32px] tracking-[0.1px] text-g4 [--lh:1.2em]">{title}</h3>
      </div>
    </article>
  );
}

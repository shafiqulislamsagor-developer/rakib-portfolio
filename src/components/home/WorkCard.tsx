import Image from "next/image";
import Link from "next/link";
import { Tag } from "../kit";

type WorkCardProps = {
  title: string;
  image: string;
  alt?: string;
  tags: string[];
  href: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Project card. On hover the "View" disc rises from the bottom edge to the middle (card variant). */
export function WorkCard({ title, image, alt = "", tags, href, className = "", style }: WorkCardProps) {
  return (
    <article className={`flex w-[670px] flex-col gap-3 ${className}`} style={style}>
      <Link
        href={href}
        aria-label={`View ${title}`}
        data-reveal="clip"
        className="group relative block h-[520px] w-full overflow-hidden rounded-[4px] bg-[#d9d9d9]"
      >
        {/* below 1440px the page is zoomed to viewport/1440, so the 670px card really is ~47vw wide */}
        {image && <Image src={image} alt={alt} fill sizes="(max-width: 1440px) 47vw, 670px" className="object-fill" />}
        <span
          aria-hidden
          className="absolute top-full left-[495px] flex size-20 items-center justify-center rounded-full bg-white mix-blend-color-dodge transition-transform duration-300 ease-figma-out group-hover:-translate-y-[300px] group-focus-visible:-translate-y-[300px]"
        >
          <span className="trim text-[16px] tracking-[0.1px] text-ink [--lh:1.2em]">View</span>
        </span>
      </Link>
      <div data-reveal="up" className="flex flex-col gap-4">
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

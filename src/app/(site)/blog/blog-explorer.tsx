"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowUpRightSmall } from "@/components/icons";
import { Tag } from "@/components/kit";
import { formatDate } from "@/lib/format";
import type { PostData } from "@/types/content";

/**
 * The article list: one hairline-separated row per post, in the same rhythm as
 * the services rows on the home page — the title grows and lightens on hover
 * while the cover shot fades in beside it.
 */
export default function BlogExplorer({ posts }: { posts: PostData[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [, startTransition] = useTransition();

  const tags = useMemo(() => [...new Set(posts.flatMap((post) => post.tags))].filter(Boolean).sort(), [posts]);
  const filtered = useMemo(() => (tag ? posts.filter((post) => post.tags.includes(tag)) : posts), [posts, tag]);

  function choose(next: string) {
    setTag(next);
    const search = new URLSearchParams();
    if (next) search.set("tag", next);
    startTransition(() => router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false }));
  }

  if (!posts.length) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-10">
        <div className="grid place-items-center rounded-[4px] border border-dashed border-[#4e4e4e]/60 px-6 py-20 text-center">
          <p className="text-[28px] leading-[1.2] text-g1">Nothing published yet.</p>
          <p className="mt-2 text-[16px] text-g2">The first article is on its way.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Articles" className="relative mx-auto w-full max-w-[1440px] px-10">
      {tags.length > 1 && (
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filter by tag">
          {["", ...tags].map((item) => (
            <button
              key={item || "all"}
              type="button"
              aria-pressed={tag === item}
              onClick={() => choose(item)}
              className={`inline-flex cursor-pointer items-center rounded-[4px] border p-[7px] text-[12px] tracking-[0.1px] whitespace-nowrap transition-colors duration-300 ease-figma-out ${
                tag === item ? "border-white bg-white text-ink" : "border-[#a0a0a0] text-g4 hover:border-white hover:text-white"
              }`}
            >
              {item || "All"}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-12 flex flex-col">
        {filtered.map((post, index) => (
          <li key={post.id}>
            <Link
              href={`/blog/${post.slug}`}
              data-reveal="up"
              data-reveal-delay={String(index * 0.06)}
              className="group relative flex items-start justify-between gap-10 border-t border-[#4e4e4e]/50 py-10 last:border-b"
            >
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex items-center gap-4 text-[14px] text-g2">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span aria-hidden>/</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2 className="max-w-[780px] text-[40px] leading-[46px] tracking-[-1.2px] text-g2 transition-colors duration-300 ease-figma-out group-hover:text-mist">
                  {post.title}
                </h2>
                {post.excerpt && <p className="max-w-[670px] text-[16px] leading-[24px] text-g2">{post.excerpt}</p>}
                {post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {post.tags.slice(0, 3).map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-start gap-8">
                {post.coverImage.url && (
                  <span className="relative hidden h-[140px] w-[240px] overflow-hidden rounded-[4px] opacity-0 transition-opacity duration-300 ease-figma-out group-hover:opacity-100 lg:block">
                    <Image src={post.coverImage.url} alt={post.coverImage.alt} fill sizes="240px" className="object-cover" />
                  </span>
                )}
                <span className="mt-3 grid size-10 shrink-0 place-items-center rounded-full border border-[#4e4e4e] text-g2 transition-colors duration-300 ease-figma-out group-hover:border-white group-hover:text-white">
                  <ArrowUpRightSmall />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!filtered.length && (
        <p className="mt-10 text-[16px] text-g2">
          Nothing tagged “{tag}”.{" "}
          <button type="button" onClick={() => choose("")} className="cursor-pointer text-mist underline">
            Show everything
          </button>
        </p>
      )}
    </section>
  );
}

"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { WorkCard } from "@/components/home/WorkCard";
import type { Work } from "@/lib/design";

/**
 * The work index. Cards are the same 670px project cards as the home page, in
 * the staggered two-column canvas of the design; the filter above them is
 * built from the tags the projects already carry.
 */
const columnX = [0, 690];
const rowStep = 594;

export default function ProjectExplorer({ projects }: { projects: Work[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [, startTransition] = useTransition();

  const tags = useMemo(() => [...new Set(projects.flatMap((project) => project.tags))].filter(Boolean).sort(), [projects]);
  const filtered = useMemo(() => (tag ? projects.filter((project) => project.tags.includes(tag)) : projects), [projects, tag]);

  function choose(next: string) {
    setTag(next);
    const search = new URLSearchParams();
    if (next) search.set("tag", next);
    startTransition(() => router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false }));
  }

  return (
    <section aria-label="All work" className="relative mx-auto w-full max-w-[1440px]">
      {tags.length > 1 && (
        <div className="mx-auto flex w-[1360px] flex-wrap items-center gap-3" role="group" aria-label="Filter by discipline">
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

      <p className="mx-auto mt-6 w-[1360px] text-[14px] text-g2" aria-live="polite">
        {filtered.length === projects.length
          ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${projects.length} projects`}
      </p>

      {filtered.length ? (
        <div className="relative mx-auto mt-10 w-[1360px]" style={{ height: filtered.length * rowStep }}>
          {filtered.map((project, index) => (
            <WorkCard
              key={project.slug}
              title={project.title}
              image={project.image}
              alt={project.alt}
              tags={project.tags}
              href={project.href}
              className="absolute"
              style={{ left: columnX[index % 2], top: index * rowStep }}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-10 grid w-[1360px] place-items-center rounded-[4px] border border-dashed border-[#4e4e4e]/60 px-6 py-20 text-center">
          <p className="text-[28px] leading-[1.2] text-g1">Nothing under that filter.</p>
          <p className="mt-2 text-[16px] text-g2">Try another discipline, or look at everything.</p>
          <button
            type="button"
            onClick={() => choose("")}
            className="mt-8 inline-flex h-10 cursor-pointer items-center gap-2 rounded-[4px] border border-[#4e4e4e] px-5 text-[14px] text-g4 uppercase transition-colors duration-300 ease-figma-out hover:border-white hover:bg-white hover:text-ink"
          >
            <X className="size-4" /> Clear filter
          </button>
        </div>
      )}
    </section>
  );
}

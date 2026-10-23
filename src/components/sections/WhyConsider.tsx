"use client";

import Image from "next/image";
import { useRef } from "react";
import { ContentIcon } from "@/components/content-icon";
import type { Reason } from "@/lib/design";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { SvgType } from "../motion/SvgType";

/**
 * "Why consider me" heading with the scattered glass cards below it.
 * Scroll effect after uiuxsam.com: the heading stays pinned while the cards
 * scroll over it, each one flipping round to face the visitor as it rises.
 */
export function WhyConsider({ items, lineOpacity = 0.1 }: { items: Reason[]; lineOpacity?: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);

      gsap.from(q("[data-glyph]"), {
        yPercent: 120,
        autoAlpha: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.04,
        scrollTrigger: { trigger: q("svg[data-svgtype]")[0], start: "top 85%", once: true },
      });

      for (const card of q("[data-flip]") as HTMLElement[]) {
        gsap.fromTo(
          card,
          { rotationY: -180, transformPerspective: 1200 },
          {
            rotationY: 0,
            ease: "power1.out",
            // done by the time the first card reaches its place in the design (section top at the viewport top)
            scrollTrigger: { trigger: card, start: "top bottom", end: "top 78%", scrub: 0.7 },
          },
        );
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="why-title" className="relative mx-auto w-full max-w-[1440px]">
      <div data-sticky className="relative h-[810px]">
        {[472, 968].map((x) => (
          <span
            key={x}
            aria-hidden
            data-reveal="line-y"
            className="absolute top-0 h-[810px] w-px"
            style={{ left: x - 0.5, background: `rgba(255,255,255,${lineOpacity})` }}
          />
        ))}
        <h2 id="why-title" className="sr-only">
          Why consider me
        </h2>
        <SvgType
          name="whyConsider"
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: 151.37, top: 332.95 }}
        />
      </div>

      {/* The cards sit at measured points; the canvas ends 320px below the last one. */}
      <div
        className="relative mx-auto -mt-[102px] w-[1360px]"
        style={{ height: Math.max(...items.map((r) => r.y), 0) + 320 }}
      >
        {items.map((r) => (
          <article
            key={r.title}
            data-flip
            className="absolute flex h-[320px] w-[325px] flex-col justify-between rounded-[4px] border border-[#989898]/30 bg-[#989898]/20 p-[30px] backdrop-blur-[27.5px]"
            style={{ left: r.x, top: r.y }}
          >
            <h3 className="trim text-[48px] font-semibold tracking-[0.1px] whitespace-pre-line text-white capitalize [--lh:1em]">
              {r.title.replace(/^\n/, "")}
            </h3>
            <div className="flex flex-col gap-[30px]">
              {r.artwork ? (
                <Image src={r.artwork} alt="" width={48} height={48} unoptimized />
              ) : (
                <ContentIcon name={r.icon} className="size-12 text-white" />
              )}
              <p className="trim text-[16px] tracking-[0.1px] text-g6 capitalize [--lh:24px]">{r.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

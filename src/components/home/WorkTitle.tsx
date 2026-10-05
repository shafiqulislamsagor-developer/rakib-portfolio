"use client";

import { useRef } from "react";
import { glyphSets } from "@/data/glyphs";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { Svg } from "../Svg";
import { SvgType } from "../motion/SvgType";

/**
 * "WORK" heading (comment: "Work text effect from inette"): while the section
 * scrolls in, the letters slide out of a squeezed, overlapping stack into their
 * places and the small glass logo drops into the O.
 */
export function WorkTitle() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const set = glyphSets.work;
      const mid = set.w / 2;
      const glyphs = gsap.utils.toArray<SVGGElement>(root.current!.querySelectorAll("[data-glyph]"));
      // the word becomes visible when the section top is ~70% down the viewport
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 72%", end: "top 12%", scrub: 0.6 },
      });
      glyphs.forEach((g, i) => {
        const [x0, , x1] = set.glyphs[i].box;
        tl.fromTo(g, { x: (mid - (x0 + x1) / 2) * 0.42 }, { x: 0, ease: "power2.inOut" }, 0);
      });
      tl.fromTo(logo.current, { y: -230, rotation: -24 }, { y: 0, rotation: 0, ease: "power2.inOut" }, 0);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative h-[810px]">
      <h2 id="work-title" className="sr-only">
        Work
      </h2>
      <SvgType name="work" className="pointer-events-none absolute max-w-none select-none" style={{ left: 95.27, top: 264.48 }} />
      <div ref={logo} className="pointer-events-none absolute" style={{ left: 622, top: 360, width: 98.13, height: 90.53 }}>
        <Svg src="/brand/glass-logo-work.svg" width={98} height={91} className="block size-full" />
      </div>
    </div>
  );
}

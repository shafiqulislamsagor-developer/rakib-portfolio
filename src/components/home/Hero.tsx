"use client";

import { useRef } from "react";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { SvgType } from "../motion/SvgType";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // page load: the name rises letter by letter out of its own box
  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .set(q("svg[data-intro]"), { autoAlpha: 1 })
        .from(q('[data-svgtype="rakibkhan"] [data-glyph]'), { y: 300, duration: 1.6, stagger: 0.06 }, 0.15)
        .from(q('[data-svgtype="uiuxdesigner"] [data-glyph]'), { y: 60, duration: 1.3, stagger: 0.035 }, 0.6)
        .fromTo(q("[data-hero-label]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "power3.out" }, 1)
        .fromTo(q("[data-hero-scroll]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.3 }, 1.7);
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative mx-auto h-[924px] w-full max-w-[1440px]">
      <h1 id="hero-title" className="sr-only">
        Rakib Khan — UI/UX Designer
      </h1>

      <p
        data-intro
        data-hero-label
        className="absolute top-[418px] left-10 text-[14px] leading-[1.33] whitespace-pre text-g1 uppercase"
      >
        {"/               2025"}
      </p>
      <p data-intro data-hero-label className="absolute top-[418px] right-10 text-[14px] leading-[1.33] text-g1 uppercase">
        Engineering_
      </p>

      <SvgType
        name="rakibkhan"
        data-intro
        className="pointer-events-none absolute max-w-none select-none"
        style={{ left: 38.88, top: 536.83 }}
      />
      <SvgType
        name="uiuxdesigner"
        data-intro
        className="pointer-events-none absolute max-w-none select-none"
        style={{ left: 44.25, top: 827.88 }}
      />

      <a
        href="#statement"
        aria-label="Scroll down"
        data-intro
        data-hero-scroll
        className="absolute top-[924px] left-[703.06px] z-10 block h-12 w-[33.88px]"
      >
        <span className="absolute inset-0 rounded-[200px] border-[1.5px] border-[#999]" />
        <span className="scroll-dot absolute top-[16.75px] left-[16.19px] h-[10.5px] w-[1.5px] rounded-full bg-white" />
      </a>

      <div
        aria-hidden
        className="pointer-events-none absolute top-[803px] left-0 h-[121px] w-full"
        style={{ background: "linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 104.3%)" }}
      />
    </section>
  );
}

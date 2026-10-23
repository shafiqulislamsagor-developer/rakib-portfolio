"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Tool } from "@/lib/design";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "../kit";

type AdvantagesProps = {
  eyebrow: string;
  heading: string;
  intro: string;
  tools: Tool[];
};

export function Advantages({ eyebrow, heading, intro, tools }: AdvantagesProps) {
  const root = useRef<HTMLElement>(null);

  // comment: "these icons will fall to the floor like footballs" — the lowest ball
  // lands first, the others drop onto the pile, each bouncing and rolling to rest
  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      const balls = (q("[data-ball]") as HTMLElement[])
        .map((el) => ({ el, y: parseFloat(el.dataset.ball || "0") }))
        .sort((a, b) => b.y - a.y);
      const tl = gsap.timeline({ scrollTrigger: { trigger: q("[data-balls]")[0], start: "top 75%", once: true } });
      tl.from(q("[data-floor]"), { autoAlpha: 0, scaleX: 0.4, duration: 1.2, ease: "power2.out" }, 0);
      balls.forEach(({ el, y }, i) => {
        const at = 0.1 + i * 0.16;
        const spin = (i % 2 ? 1 : -1) * (110 + i * 25);
        // hidden until its drop starts (it waits above the section)
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: true }, at)
          .from(el, { y: -(y + 760), duration: 1.5, ease: "bounce.out" }, at)
          .from(el, { rotation: spin, duration: 1.7, ease: "power2.out" }, at);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="advantages-title" className="relative mx-auto h-[693.51px] w-[1360px]">
      <div className="flex items-end gap-4 pr-[58px]">
        <div className="flex w-[643px] flex-col gap-2">
          <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
            {`/     ${eyebrow}`}
          </Eyebrow>
          <h2
            id="advantages-title"
            data-reveal="lines"
            className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
          >
            {heading}
          </h2>
        </div>
        <p data-reveal="lines" data-reveal-delay="0.15" className="w-[643px] text-[16px] leading-[20px] text-g2">
          {intro}
        </p>
      </div>

      <ul data-balls className="absolute top-[134px] left-[773px] h-[559.51px] w-[587px]">
        {tools.map((t) => (
          <li
            key={t.name}
            data-ball={t.y}
            className="absolute size-[150px] rounded-full border border-white/30 bg-white/15 backdrop-blur-[8px]"
            style={{ left: t.x, top: t.y }}
          >
            <Image
              src={t.icon}
              alt=""
              width={Math.round(t.iw)}
              height={Math.round(t.ih)}
              unoptimized
              className="absolute left-1/2 max-w-none -translate-x-1/2"
              style={{ top: t.iy, width: t.iw, height: t.ih }}
            />
            <span
              className={`absolute inset-x-0 text-center font-inter text-[14px] leading-[20px] text-white ${
                t.outline ? "[paint-order:stroke_fill] [-webkit-text-stroke:2px_rgba(255,255,255,0.3)]" : ""
              }`}
              style={{ top: t.iy + t.ih + 8 }}
            >
              {t.name}
            </span>
          </li>
        ))}
      </ul>

      <span
        aria-hidden
        data-floor
        className="pointer-events-none absolute origin-top-left -rotate-[0.68deg] mix-blend-difference"
        style={{
          left: 311.96,
          top: 662.33,
          width: 1301.26,
          height: 126.38,
          background:
            "radial-gradient(56.8% 46.4% at 50% 50%, rgba(40,40,40,0.6) 13%, rgba(2,2,2,0) 100%)",
        }}
      />
    </section>
  );
}

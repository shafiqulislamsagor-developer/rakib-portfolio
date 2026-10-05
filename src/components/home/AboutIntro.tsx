"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { DiscLink, DownloadCv, Eyebrow, OutlineButton } from "../ui";

// White squares scattered over the intro, relative to the section top.
const squares = [
  [154, 667, 16], [214, 1307, 32], [1147, 604, 8], [401, 535, 16], [805, 667, 28], [813, 1272, 16],
  [1131, 1216, 16], [538, 1216, 8], [154, 1706, 16], [353, 2122, 32], [1147, 1643, 8], [401, 1574, 16],
  [805, 1706, 28], [952, 2087, 16], [1270, 2031, 16], [677, 2031, 8],
] as const;

// bigger squares are "closer" and travel faster
const speedOf = (size: number) => (size >= 28 ? 0.95 : size >= 16 ? 0.55 : 0.25);

/**
 * "About me" statement, the scattered squares and the light profile panel.
 * Scroll effect after jackelder.design: the statement stays pinned while the
 * squares stream past at different speeds, then the light panel steps in.
 */
export function AboutIntro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      const field = q("[data-squares]")[0] as HTMLElement;

      // squares: parallax over the pinned part of the section
      for (const sq of q("[data-square]") as HTMLElement[]) {
        const size = parseFloat(sq.dataset.square || "16");
        gsap.to(sq, {
          y: () => -speedOf(size) * (field.offsetHeight - window.innerHeight),
          ease: "none",
          scrollTrigger: { trigger: field, start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true },
        });
      }

      // panel enters with a stepped ("pixel") top edge that closes from the centre out
      const panel = q("[data-stairs]")[0] as HTMLElement;
      const cols = 10;
      const step = 36;
      const maxSteps = 9;
      const state = { p: 0 };
      const draw = () => {
        if (state.p >= 1) {
          panel.style.clipPath = "none";
          return;
        }
        const pts = ["0% 100%"];
        for (let i = 0; i < cols; i++) {
          const f = Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2);
          const lag = Math.round(f * maxSteps * (1 - state.p)) * step;
          pts.push(`${(i / cols) * 100}% ${lag}px`, `${((i + 1) / cols) * 100}% ${lag}px`);
        }
        pts.push("100% 100%");
        panel.style.clipPath = `polygon(${pts.join(",")})`;
      };
      gsap.to(state, {
        p: 1,
        ease: "none",
        onUpdate: draw,
        scrollTrigger: { trigger: panel, start: "top bottom", end: "top 35%", scrub: true },
      });
      draw();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="about-title" className="relative">
      <div data-squares className="relative mx-auto h-[2395px] w-full max-w-[1440px]">
        <div className="absolute inset-x-0 top-0 h-[909px] bg-black" />
        <div data-sticky className="relative flex flex-col items-center gap-[30px] px-[113px] pt-[330px]">
          <Eyebrow data-reveal="fade" className="trim h-[11px] w-full text-center text-[16px] tracking-[0.8px] text-g3">
            {"/      About Me"}
          </Eyebrow>
          <h2
            id="about-title"
            data-reveal="lines"
            className="w-full text-center text-[56px] leading-[67px] tracking-[0.1px] text-g1"
          >
            {/* the trailing space counts when Figma centres the line, so keep it non-breaking */}
            I build visually striking designs&nbsp;
            <br />
            <em className="italic">that prioritize seamless user experiences.</em>
          </h2>
          <p
            data-reveal="lines"
            data-reveal-delay="0.2"
            className="w-[612px] text-center text-[18px] leading-[22px] tracking-[0.1px] text-g2"
          >
            With 05 years of experience in the design industry I have been helping to bring brands to life through
            thoughtful design that resonates.
          </p>
        </div>
        {squares.map(([x, y, s], i) => (
          <span
            key={i}
            aria-hidden
            data-square={s}
            className="absolute bg-white"
            style={{ left: x, top: y, width: s, height: s }}
          />
        ))}
      </div>

      <div data-stairs className="relative overflow-hidden bg-paper">
        <div className="relative mx-auto h-[1046px] w-full max-w-[1440px]">
          <Eyebrow data-reveal="fade" className="trim absolute top-[229.5px] left-10 text-[16px] tracking-[0.8px] text-ink">
            {"/     Profile"}
          </Eyebrow>
          <div className="absolute top-[580.5px] left-10 flex w-[690px] flex-col items-end gap-1 text-ink">
            <p data-reveal="up" className="text-[48px] leading-[58px] tracking-[0.1px] whitespace-pre italic">
              {"Hey’ This is  Rakib Khan"}
            </p>
            <p data-reveal="lines" data-reveal-delay="0.1" className="w-full text-[48px] leading-[58px] tracking-[0.1px]">
              For over five years, I have been dedicate{" "}
              <em className="italic">crafting intuitive and engaging digital experiences.</em>
            </p>
          </div>

          <div data-reveal="clip" className="absolute top-[128px] left-[846px] h-[520px] w-[420px] overflow-hidden">
            <Image
              src="/images/profile-home.webp"
              alt="Portrait of Rakib Khan"
              width={840}
              height={1040}
              sizes="420px"
              className="block h-[520px] w-[420px]"
            />
          </div>
          <div className="absolute top-[698px] left-[846px] flex w-[554px] flex-col gap-10">
            <p data-reveal="lines" className="text-[18px] leading-[28px] tracking-[0.1px] text-ink">
              As a passionate UI/UX designer with a strong background in crafting intuitive and visually compelling
              digital experiences. With expertise in website design, mobile apps, SaaS platforms, branding, and
              interactive prototyping, I transform ideas into engaging user interfaces that drive results.
            </p>
            <div data-reveal="up" data-reveal-delay="0.2" className="flex gap-10">
              <OutlineButton label="Learn More" href="/about" tone="dark" className="w-[180px]" />
              <DownloadCv tone="dark" />
            </div>
          </div>
          <DiscLink label="About me" href="/about" style={{ left: 805.5, top: 209.55 }} />
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { SvgType } from "../motion/SvgType";
import { Svg } from "../Svg";
import { DiscLink, Eyebrow, OutlineButton } from "../ui";

export function AboutHero() {
  const root = useRef<HTMLElement>(null);

  // page load: letters rise out of their box, the glass logo turns into place
  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .set(q("svg[data-intro]"), { autoAlpha: 1 })
        .from(q("[data-glyph]"), { y: 290, duration: 1.6, stagger: 0.08 }, 0.2)
        .fromTo(
          q("[data-about-logo]"),
          { autoAlpha: 0, scale: 0.6, rotation: -60, y: 200 },
          { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: 1.8 },
          0.45,
        );
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="about-hero-title" className="relative mx-auto h-[810px] w-full max-w-[1440px] overflow-hidden">
      <h1 id="about-hero-title" className="sr-only">
        About Rakib Khan
      </h1>
      <SvgType name="about" data-intro className="pointer-events-none absolute max-w-none select-none" style={{ left: 85, top: 316.83 }} />
      <div
        data-intro
        data-about-logo
        className="pointer-events-none absolute"
        style={{ left: 504, top: 237, width: 432, height: 398.53 }}
      >
        <div className="logo-float size-full">
          <Svg src="/brand/glass-logo-about.svg" width={432} height={399} className="block size-full max-w-none select-none" />
        </div>
      </div>
    </section>
  );
}

// Figma blends colour and alpha separately, so the fade darkens as it disappears.
const fade =
  "linear-gradient(180deg, rgba(161,161,161,1) 0%, rgba(141,141,141,0.875) 5.95%, rgba(121,121,121,0.75) 11.9%, rgba(101,101,101,0.625) 17.85%, rgba(82,82,82,0.5) 23.8%, rgba(62,62,62,0.375) 29.75%, rgba(42,42,42,0.25) 35.7%, rgba(22,22,22,0.125) 41.65%, rgba(2,2,2,0) 47.6%)";

/** Intro paragraph fading out, with the portrait and mission card overlapping it. */
export function AboutProfile() {
  const root = useRef<HTMLDivElement>(null);

  // comment: "when scrolling down, this text comes out of the shadow" — the fade
  // stretches downwards until every line is lit
  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const text = root.current!.querySelector<HTMLElement>("[data-shadow-text]")!;
      gsap.fromTo(
        text,
        { backgroundSize: "100% 100%" },
        {
          backgroundSize: "100% 270%",
          ease: "none",
          scrollTrigger: { trigger: text, start: "top 70%", end: "bottom 70%", scrub: 0.6 },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <section aria-label="Profile" className="relative z-10 mx-auto h-[975px] w-full max-w-[1440px]">
        <Eyebrow data-reveal="fade" className="trim absolute top-0 left-[39px] text-[16px] tracking-[0.8px] text-g3">
          {"/     Profile"}
        </Eyebrow>
        <p
          data-shadow-text
          className="pointer-events-none absolute top-[51px] left-[95px] w-[1249px] bg-clip-text bg-no-repeat text-[70px] leading-[84px] tracking-[0.1px] whitespace-pre-wrap text-transparent"
          style={{ backgroundImage: fade }}
        >
          {"                   "}
          <em className="italic">Hello, and welcome to</em> my profile! I am Rakib Khan, an experienced UI/UX designer
          with a deep passion for creating seamless and engaging digital experiences. I have multiple skills, experience
          in graphic design, UIUX design, IT support. I specialize in designing intuitive and visually appealing
          interfaces that increase user satisfaction and improve digital interactions.
        </p>
        <DiscLink label="get in touch" href="#contact" style={{ left: 1157, top: 7 }} />
      </section>

      <section aria-label="Mission" className="relative mx-auto -mt-[488px] h-[810px] w-full max-w-[1440px]">
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-[176.86px] bg-[#696969]/50 blur-[250px]"
          style={{ left: 404, top: -256, width: 308, height: 319 }}
        />
        <div data-reveal="up" className="pointer-events-none absolute top-[-100px] left-0 h-[1110px] w-[900px]">
          <Image
            src="/images/profile-about.webp"
            alt="Portrait of Rakib Khan"
            width={1800}
            height={2220}
            sizes="900px"
            className="block h-[1110px] w-[900px] max-w-none"
          />
        </div>
        <div
          data-reveal="wipe"
          data-reveal-delay="0.3"
          className="absolute"
          style={{ left: 620.76, top: 320.88, width: 114.022, height: 89.836 }}
        >
          <Svg src="/brand/dashed-connector.svg" width={114} height={90} className="block size-full max-w-none" />
        </div>
        <div
          data-reveal="up"
          className="absolute top-[133px] left-[715.06px] flex w-[488px] items-center justify-center rounded-[4px] border border-[#595959]/50 bg-[#a1a1a1]/5 px-[26px] py-4 backdrop-blur-[10px]"
        >
          <p className="w-[436px] text-[18px] leading-[28px] tracking-[0.1px] text-g2">
            Strive to redefine digital experiences by blending creativity with functionality, ensuring intuitive and
            engaging designs. My mission is to craft user-centric interfaces that elevate brands, enhance usability, and
            create meaningful interactions across web, mobile, and SaaS platforms.
          </p>
        </div>
        <div className="absolute top-[485px] left-[818.76px] flex w-[555px] flex-col gap-10">
          <p data-reveal="lines" className="text-[18px] leading-[28px] tracking-[0.1px] text-g2">
            I follow a user-centric approach, starting with in-depth research and wireframing, then crafting intuitive,
            visually stunning designs. Through collaboration and iteration, I ensure every project meets user needs and
            business goals seamlessly.
          </p>
          <div data-reveal="up" data-reveal-delay="0.2" className="flex">
            <OutlineButton label="Contact me" href="#contact" className="w-[226px]" />
          </div>
        </div>
      </section>
    </div>
  );
}

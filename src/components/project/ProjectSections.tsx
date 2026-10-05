"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/data/projects";
import { figmaLinearGradient, sheenStops } from "@/lib/figma";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { ArrowUpRight48, ArrowUpRightLarge } from "../icons";
import { SvgType } from "../motion/SvgType";
import { Eyebrow, OutlineButton, TextSlide } from "../ui";

const hairline = "bg-white/[0.07]";

/**
 * Case-study hero (comment: "like atolldigital.com/work/kubota"): on load the
 * title rises letter by letter lower on the screen, then lifts into place while
 * the hairlines draw and the details fade in.
 */
export function ProjectHero({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const t = project.titleArt;

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .set(q("[data-title]"), { autoAlpha: 1, y: 320 })
        .from(q("[data-glyph]"), { y: 170, duration: 1.3, stagger: 0.06 }, 0.1)
        .to(q("[data-title]"), { y: 0, duration: 1.3, ease: "power4.inOut" }, 1.25)
        .fromTo(q("[data-line-x]"), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: "power4.inOut", stagger: 0.1 }, 1.7)
        .fromTo(q("[data-line-y]"), { scaleY: 0 }, { scaleY: 1, duration: 1.3, ease: "power4.inOut" }, 1.85)
        .fromTo(
          q("[data-fade-up]"),
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.1 },
          2.05,
        )
        .fromTo(
          q("[data-hero-image]"),
          { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power4.inOut", clearProps: "clipPath" },
          1.95,
        )
        .fromTo(q("[data-hero-image] img"), { scale: 1.25 }, { scale: 1, duration: 2, ease: "power3.out", clearProps: "transform" }, 1.95);
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="project-title" className="relative mx-auto h-[810px] w-full max-w-[1440px] overflow-hidden">
      <span aria-hidden data-line-x className={`absolute inset-x-0 bottom-0 h-px origin-left ${hairline}`} />
      <span aria-hidden data-line-x className={`absolute top-[315px] left-0 h-px w-full origin-left ${hairline}`} />
      <span aria-hidden data-line-y className={`absolute top-[316px] left-[203.5px] h-[494px] w-px origin-top ${hairline}`} />

      <h1 id="project-title" className="sr-only">
        {project.name}
      </h1>
      <div data-intro data-title className="pointer-events-none absolute" style={{ left: t.x, top: t.y }}>
        <SvgType name={t.glyphs} className="block max-w-none select-none" />
      </div>
      <Eyebrow
        data-intro
        data-fade-up
        className="trim absolute top-[89px] left-[1287px] text-[14px] tracking-[0.7px] text-g3"
      >
        {"/     Case study"}
      </Eyebrow>

      <dl className="absolute top-[341px] left-[247px] flex w-[413px] flex-col gap-5 pt-8 text-[20px] leading-[26.4px] text-g2">
        {project.facts.map((f) => (
          <div key={f.label} data-intro data-fade-up className="flex items-center gap-12">
            <dt className="flex w-[76px] shrink-0 justify-center">{f.label}</dt>
            <dd className="whitespace-pre-line">{f.value.join("\n")}</dd>
          </div>
        ))}
        <div data-intro data-fade-up className="flex items-center gap-12">
          <dt className="flex w-[76px] shrink-0 justify-center">Website</dt>
          <dd className="flex">
            <OutlineButton slide label={project.website.label} href={project.website.href} className="h-8! w-[150px]" />
          </dd>
        </div>
      </dl>

      <div
        data-intro
        data-hero-image
        className="absolute top-[341px] left-[660px] h-[444px] w-[740px] overflow-hidden rounded-[4px] bg-[#d9d9d9]"
      >
        <Image src={project.hero} alt={`${project.name} preview`} fill sizes="740px" preload className="object-cover" />
      </div>
    </section>
  );
}

const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

function Shot({
  src,
  w,
  h,
  alt = "",
  reveal = "clip",
  delay,
}: {
  src: string;
  w: number;
  h: number;
  alt?: string;
  reveal?: "clip" | "grow" | "none";
  delay?: number;
}) {
  return (
    <div
      data-reveal={reveal === "clip" ? "clip" : undefined}
      data-grow={reveal === "grow" ? "" : undefined}
      data-reveal-delay={delay ? String(delay) : undefined}
      className="group relative shrink-0 overflow-hidden rounded-[4px] bg-[#d9d9d9]"
      style={{ width: w, height: h }}
    >
      {isVideo(src) ? (
        <video src={src} autoPlay muted loop playsInline aria-label={alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${w}px`}
          className="object-fill transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

export function Overview({ project }: { project: Project }) {
  const [a, b, c, d] = project.gallery;
  return (
    <section aria-label="Overview" className="relative mx-auto w-full max-w-[1440px]">
      <div className="ml-[46px] flex w-[1360px] flex-col gap-32">
        <div className="flex flex-col gap-10">
          <Eyebrow data-reveal="fade" className="trim h-[10px] text-[14px] tracking-[0.7px] text-g3">
            {"/     Overview"}
          </Eyebrow>
          <p data-reveal="up" className="pl-[229px] text-[36px] leading-[43px] tracking-[0.1px] whitespace-pre-wrap text-g2">
            {"                "}
            <em className="italic">
              {"   "}
              {project.overview.lead}
            </em>
            {project.overview.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Shot src={a} w={1360} h={810} />
          <Shot src={b} w={670} h={500} />
          <Shot src={c} w={325} h={500} delay={0.12} />
          <Shot src={d} w={325} h={500} delay={0.24} />
        </div>
      </div>
    </section>
  );
}

export function DesignProcess({ project }: { project: Project }) {
  const [a, b, c] = project.process.images;
  return (
    <section aria-labelledby="process-heading" className="relative mx-auto w-full max-w-[1440px]">
      <div className="ml-[46px] flex w-[1360px] flex-col gap-10">
        <div className="flex justify-between">
          <h2
            id="process-heading"
            data-reveal="lines"
            className="small-caps w-[578px] shrink-0 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
          >
            Design Process
          </h2>
          <p data-reveal="lines" data-reveal-delay="0.1" className="h-[196px] w-[782px] shrink-0 text-[18px] leading-[28px] tracking-[0.1px] text-g2">
            {project.process.body}
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex gap-5">
            <Shot src={a} w={557} h={500} />
            <Shot src={b} w={783} h={500} delay={0.12} />
          </div>
          <Shot src={c} w={1360} h={500} />
        </div>
      </div>
    </section>
  );
}

export function FullPreview({ project }: { project: Project }) {
  return (
    <section aria-labelledby="preview-heading" className="relative mx-auto w-full max-w-[1440px]">
      <div className="ml-[41px] flex w-[1370px] flex-col gap-10">
        <h2
          id="preview-heading"
          data-reveal="lines"
          className="small-caps h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
        >
          Full overview
        </h2>
        <div data-reveal="clip" className="relative h-[8684px] w-[1370px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
          <Image src={project.fullPreview} alt={`${project.name} full page design`} fill sizes="1370px" className="object-fill" />
        </div>
      </div>
    </section>
  );
}

function SheenTitle({ text, size, box }: { text: string; size: number; box: [number, number] }) {
  return (
    <span
      className="trim small-caps inline-block bg-clip-text tracking-[0.1px] text-transparent"
      style={{
        fontSize: size,
        backgroundImage: figmaLinearGradient(
          [
            { x: 0.2524, y: -0.6011 },
            { x: 0.3658, y: 1.3645 },
          ],
          sheenStops,
          box[0],
          box[1],
        ),
      }}
    >
      {text}
    </span>
  );
}

/**
 * Next project (comment: "next project preview and CTA animation like Kubota"):
 * the previews unfold downwards while scrolling in, and on hover the title is
 * replaced by a copy rising from below while the arrow swaps out.
 */
export function NextProject({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const { large, small } = project.next;

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      for (const el of q("[data-grow]") as HTMLElement[]) {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: 0.5 },
          },
        );
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Next project" className="relative mx-auto w-full max-w-[1440px]">
      <div className="relative ml-[6px] h-[810px] w-[1440px] overflow-hidden">
        <span aria-hidden data-reveal="line-x" className={`absolute inset-x-0 bottom-0 h-px ${hairline}`} />
        <span aria-hidden data-reveal="line-x" className={`absolute top-[79.5px] left-0 h-px w-full ${hairline}`} />
        <span aria-hidden data-reveal="line-y" className={`absolute top-20 left-[548.5px] h-[730px] w-px ${hairline}`} />

        <Eyebrow data-reveal="fade" className="absolute top-[114px] left-[41px] text-[16px] leading-[14px] tracking-[1.26px] text-g1">
          {"/     Nex project"}
        </Eyebrow>

        <Link href={`/projects/${large.slug}`} className="group absolute top-[114px] left-[615px] flex w-[784px] flex-col gap-12">
          <span data-reveal="up" className="flex h-[84px] w-[775px] items-center justify-between">
            <TextSlide className="-mb-[36px] pb-[36px]">
              <SheenTitle text={large.name} size={120} box={[316, 84]} />
            </TextSlide>
            <span className="icon-swap size-[84px] text-g1">
              <ArrowUpRightLarge className="size-[84px]" />
              <ArrowUpRightLarge className="size-[84px]" />
            </span>
          </span>
          <Shot src={large.image} w={784} h={530} alt={large.name} reveal="grow" />
        </Link>

        <Link href={`/projects/${small.slug}`} className="group absolute top-[404px] left-[41px] flex w-[442px] flex-col gap-6">
          <span data-reveal="up" className="flex h-12 w-full items-center justify-between">
            <TextSlide className="-mb-[17px] pb-[17px]">
              <SheenTitle text={small.name} size={56} box={[191, 39]} />
            </TextSlide>
            <span className="icon-swap size-12 text-g1">
              <ArrowUpRight48 className="size-12" />
              <ArrowUpRight48 className="size-12" />
            </span>
          </span>
          <Shot src={small.image} w={442} h={300} alt={small.name} reveal="grow" />
        </Link>
      </div>
    </section>
  );
}

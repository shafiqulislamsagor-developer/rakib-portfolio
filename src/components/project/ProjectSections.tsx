import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { figmaLinearGradient, sheenStops } from "@/lib/figma";
import { ArrowUpRight48, ArrowUpRightLarge } from "../icons";
import { Eyebrow, OutlineButton } from "../ui";

const hairline = "bg-white/[0.07]";

export function ProjectHero({ project }: { project: Project }) {
  const t = project.titleArt;
  return (
    <section aria-labelledby="project-title" className="relative mx-auto h-[810px] w-full max-w-[1440px] overflow-hidden">
      <span aria-hidden className={`absolute inset-x-0 bottom-0 h-px ${hairline}`} />
      <span aria-hidden className={`absolute top-[315px] left-0 h-px w-full ${hairline}`} />
      <span aria-hidden className={`absolute top-[316px] left-[203.5px] h-[494px] w-px ${hairline}`} />

      <h1 id="project-title" className="sr-only">
        {project.name}
      </h1>
      <Image
        src={t.src}
        alt=""
        width={t.width}
        height={t.height}
        unoptimized
        loading="eager"
        className="hero-rise pointer-events-none absolute max-w-none select-none"
        style={{ left: t.x, top: t.y }}
      />
      <Eyebrow className="trim absolute top-[89px] left-[1287px] text-[14px] tracking-[0.7px] text-g3">
        {"/     Case study"}
      </Eyebrow>

      <dl className="absolute top-[341px] left-[247px] flex w-[413px] flex-col gap-5 pt-8 text-[20px] leading-[26.4px] text-g2">
        {project.facts.map((f) => (
          <div key={f.label} className="flex items-center gap-12">
            <dt className="flex w-[76px] shrink-0 justify-center">{f.label}</dt>
            <dd className="whitespace-pre-line">{f.value.join("\n")}</dd>
          </div>
        ))}
        <div className="flex items-center gap-12">
          <dt className="flex w-[76px] shrink-0 justify-center">Website</dt>
          <dd>
            <OutlineButton label={project.website.label} href={project.website.href} className="h-8! w-[150px]" />
          </dd>
        </div>
      </dl>

      <div className="absolute top-[341px] left-[660px] h-[444px] w-[740px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
        <Image src={project.hero} alt={`${project.name} preview`} fill sizes="740px" preload className="object-cover" />
      </div>
    </section>
  );
}

function Shot({ src, w, h, alt = "" }: { src: string; w: number; h: number; alt?: string }) {
  return (
    <div className="group relative shrink-0 overflow-hidden rounded-[4px] bg-[#d9d9d9]" style={{ width: w, height: h }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${w}px`}
        className="object-fill transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
      />
    </div>
  );
}

export function Overview({ project }: { project: Project }) {
  const [a, b, c, d] = project.gallery;
  return (
    <section aria-label="Overview" className="relative mx-auto w-full max-w-[1440px]">
      <div className="ml-[46px] flex w-[1360px] flex-col gap-32">
        <div className="flex flex-col gap-10">
          <Eyebrow className="trim h-[10px] text-[14px] tracking-[0.7px] text-g3">{"/     Overview"}</Eyebrow>
          <p className="pl-[229px] text-[36px] leading-[43px] tracking-[0.1px] whitespace-pre-wrap text-g2">
            {"                "}
            <em className="italic">{"   "}{project.overview.lead}</em>
            {project.overview.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Shot src={a} w={1360} h={810} />
          <Shot src={b} w={670} h={500} />
          <Shot src={c} w={325} h={500} />
          <Shot src={d} w={325} h={500} />
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
            className="small-caps w-[578px] shrink-0 text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
          >
            Design Process
          </h2>
          <p className="h-[196px] w-[782px] shrink-0 text-[18px] leading-[28px] tracking-[0.1px] text-g2">{project.process.body}</p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex gap-5">
            <Shot src={a} w={557} h={500} />
            <Shot src={b} w={783} h={500} />
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
        <h2 id="preview-heading" className="small-caps h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
          Full overview
        </h2>
        <div className="relative h-[8684px] w-[1370px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
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

export function NextProject({ project }: { project: Project }) {
  const { large, small } = project.next;
  return (
    <section aria-label="Next project" className="relative mx-auto w-full max-w-[1440px]">
      <div className="relative ml-[6px] h-[810px] w-[1440px] overflow-hidden">
        <span aria-hidden className={`absolute inset-x-0 bottom-0 h-px ${hairline}`} />
        <span aria-hidden className={`absolute top-[79.5px] left-0 h-px w-full ${hairline}`} />
        <span aria-hidden className={`absolute top-20 left-[548.5px] h-[730px] w-px ${hairline}`} />

        <Eyebrow className="absolute top-[114px] left-[41px] text-[16px] leading-[14px] tracking-[1.26px] text-g1">
          {"/     Nex project"}
        </Eyebrow>

        <Link href={`/projects/${large.slug}`} className="group absolute top-[114px] left-[615px] flex w-[784px] flex-col gap-12">
          <span className="flex h-[84px] w-[775px] items-center justify-between">
            <SheenTitle text={large.name} size={120} box={[316, 84]} />
            <ArrowUpRightLarge className="size-[84px] text-g1 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
          <Shot src={large.image} w={784} h={530} alt={large.name} />
        </Link>

        <Link href={`/projects/${small.slug}`} className="group absolute top-[404px] left-[41px] flex w-[442px] flex-col gap-6">
          <span className="flex h-12 w-full items-center justify-between">
            <SheenTitle text={small.name} size={56} box={[191, 39]} />
            <ArrowUpRight48 className="size-12 text-g1 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
          <Shot src={small.image} w={442} h={300} alt={small.name} />
        </Link>
      </div>
    </section>
  );
}

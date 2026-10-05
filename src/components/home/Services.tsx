import Image from "next/image";
import { services } from "@/data/site";
import { DiscLink, Eyebrow } from "../ui";

export function Services() {
  return (
    <section id="services" aria-label="What I do" className="relative mx-auto h-[875px] w-full max-w-[1440px]">
      <Eyebrow data-reveal="fade" className="trim absolute top-0 left-[44.13px] text-[16px] tracking-[0.8px] text-g3">
        {"/      What i Do"}
      </Eyebrow>
      {/* static logo slot; with motion on, the hero logo flies in and takes its place */}
      <div
        data-motion-hide
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: 87.79, top: 260.73, width: 344.7, height: 398.53 }}
      >
        <div className="logo-cycle size-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- static vector, no optimisation needed */}
          <img src="/brand/logo-glass.svg" alt="" width={345} height={399} className="block size-full" />
        </div>
      </div>

      <p
        data-reveal="lines"
        className="absolute top-0 left-[817.13px] w-[579px] text-[18px] leading-[28px] tracking-[0.1px] text-g2"
      >
        I craft seamless digital experiences by blending creativity with strategy. From UX research to web &amp; mobile
        UI, I design intuitive interfaces that enhance usability. Whether it’s a SaaS platform or brand identity, my goal
        is to make every interaction engaging and impactful.
      </p>

      <ul className="absolute top-[227px] left-[608.13px] flex w-[788px] flex-col gap-10">
        {services.map((s, i) => (
          <li
            key={s.title}
            className="group relative h-[132px] transition-[height] duration-300 ease-figma-out hover:h-[220px]"
          >
            <span
              aria-hidden
              data-reveal="line-x"
              data-reveal-delay={String(i * 0.08)}
              className="absolute inset-x-0 bottom-0 h-px bg-[#595959]/50"
            />
            <div data-reveal="up" data-reveal-delay={String(0.1 + i * 0.08)} className="absolute inset-0">
              {/* hover variant: the title shrinks to 48px and moves down to make room */}
              <h3 className="trim absolute top-10 left-4 origin-top-left text-[74px] text-g2 transition-[translate,scale,color] duration-300 ease-figma-out group-hover:translate-y-[18.5px] group-hover:scale-[0.6486] group-hover:text-g4">
                {s.title}
              </h3>
            </div>
            <p className="pointer-events-none absolute top-[113.6px] left-4 w-[436px] text-[16px] leading-[24px] text-[#989898] opacity-0 transition-opacity duration-300 ease-figma-out group-hover:opacity-100">
              {s.desc}
            </p>
            <div className="pointer-events-none absolute top-10 right-4 h-[140px] w-[280px] overflow-hidden rounded-[4px] opacity-0 transition-opacity duration-300 ease-figma-out group-hover:opacity-100">
              <Image src={s.image} alt="" fill sizes="280px" className="object-cover" />
            </div>
          </li>
        ))}
      </ul>

      <DiscLink label="get in touch" href="#contact" style={{ left: 1010.13, top: 211 }} />
    </section>
  );
}

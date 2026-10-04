import Image from "next/image";
import { services } from "@/data/site";
import { DiscLink, Eyebrow } from "../ui";

export function Services() {
  return (
    <section id="services" aria-label="What I do" className="relative mx-auto h-[875px] w-full max-w-[1440px]">
      <Eyebrow className="trim absolute top-0 left-[44.13px] text-[16px] tracking-[0.8px] text-g3">
        {"/      What i Do"}
      </Eyebrow>
      <Image
        src="/brand/logo-glass.svg"
        alt=""
        width={345}
        height={399}
        unoptimized
        className="logo-float pointer-events-none absolute max-w-none select-none [animation-delay:-3s]"
        style={{ left: 87.79, top: 260.73, width: 344.7, height: 398.53 }}
      />

      <p className="absolute top-0 left-[817.13px] w-[579px] text-[18px] leading-[28px] tracking-[0.1px] text-g2">
        I craft seamless digital experiences by blending creativity with strategy. From UX research to web &amp; mobile
        UI, I design intuitive interfaces that enhance usability. Whether it’s a SaaS platform or brand identity, my goal
        is to make every interaction engaging and impactful.
      </p>

      <ul className="absolute top-[227px] left-[608.13px] flex w-[788px] flex-col gap-10">
        {services.map((s) => (
          <li
            key={s}
            className="group flex h-[132px] items-center border-b border-[#595959]/50 px-4 py-10"
          >
            <h3 className="trim text-[74px] text-g2 transition-[color,transform] duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-3 group-hover:text-g5">
              {s}
            </h3>
          </li>
        ))}
      </ul>

      <DiscLink label="get in touch" href="#contact" style={{ left: 1010.13, top: 211 }} />
    </section>
  );
}

import Image from "next/image";
import { reasons } from "@/data/site";

/** "Why consider me" heading with the scattered glass cards below it. */
export function WhyConsider({ lineOpacity = 0.1 }: { lineOpacity?: number }) {
  return (
    <section aria-labelledby="why-title" className="relative mx-auto w-full max-w-[1440px]">
      <div className="relative h-[810px]">
        {[472, 968].map((x) => (
          <span
            key={x}
            aria-hidden
            className="absolute top-0 h-[810px] w-px"
            style={{ left: x - 0.5, background: `rgba(255,255,255,${lineOpacity})` }}
          />
        ))}
        <h2 id="why-title" className="sr-only">
          Why consider me
        </h2>
        <Image
          src="/type/why-consider-me.svg"
          alt=""
          width={1132}
          height={82}
          unoptimized
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: 151.37, top: 332.95 }}
        />
      </div>

      <div className="relative mx-auto -mt-[102px] h-[1928px] w-[1360px]">
        {reasons.map((r) => (
          <article
            key={r.title}
            className="absolute flex h-[320px] w-[325px] flex-col justify-between rounded-[4px] border border-[#989898]/30 bg-[#989898]/20 p-[30px] backdrop-blur-[27.5px] transition-transform duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-2"
            style={{ left: r.x, top: r.y }}
          >
            <h3 className="trim text-[48px] font-semibold tracking-[0.1px] whitespace-pre-line text-white capitalize [--lh:1em]">
              {r.title.replace(/^\n/, "")}
            </h3>
            <div className="flex flex-col gap-[30px]">
              <Image src={r.icon} alt="" width={48} height={48} unoptimized />
              <p className="trim text-[16px] tracking-[0.1px] text-g6 capitalize [--lh:24px]">{r.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

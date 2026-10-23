import { processSteps } from "@/data/site";
import { Eyebrow } from "../ui";

export function Process() {
  return (
    <section aria-labelledby="process-title" className="relative mx-auto flex h-[2300px] w-full max-w-[1440px] justify-between px-10">
      {/* pinned while the steps scroll past it (see [data-sticky] in globals.css) */}
      <div data-sticky className="h-fit w-[460px] self-start py-32">
        <div className="flex flex-col gap-2">
          <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">{"/     Process"}</Eyebrow>
          <div className="flex flex-col gap-6 pr-[67px]">
            <h2
              id="process-title"
              data-reveal="lines"
              className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
            >
              Work Process
            </h2>
            <p data-reveal="lines" data-reveal-delay="0.15" className="text-[16px] leading-[20px] text-g2">
              I follow a clear, user-focused process—from research to delivery—that ensures every design is purposeful,
              effective, and aligned with project goals.
            </p>
          </div>
        </div>
      </div>

      <ol className="relative mt-[260px] h-[2040px] w-[900px]">
        {processSteps.map((s, i) => (
          <li
            key={s.title}
            data-reveal="up"
            data-reveal-delay={String((i % 2) * 0.12)}
            className="absolute flex h-[408px] w-[450px] flex-col justify-end rounded-[4px] border border-[#4e4e4e]/50 px-[27px] py-7"
            style={{ left: i % 2 === 0 ? 0 : 450, top: i * 408 }}
          >
            <p className="absolute top-7 right-[27px] left-[27px] text-right text-[14px] leading-[20px] whitespace-pre text-g2">
              {`/    ${s.index}`}
            </p>
            <div className="flex w-[387px] flex-col gap-[108px]">
              <h3 className="text-[32px] leading-[38px] tracking-[-1.68px] text-g1">{s.title}</h3>
              <p className="text-[16px] leading-[24px] text-g2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import Image from "next/image";
import { figmaLinearGradient } from "@/lib/figma";
import { DownloadCv, OutlineButton } from "../ui";

const background = figmaLinearGradient(
  [
    { x: 0.3215, y: -0.1297 },
    { x: 0.2031, y: 1.5197 },
  ],
  [
    ["#f1f1f1", 0],
    ["#aeaeae", 0.554],
    ["#a1a1a1", 0.705],
    ["#a1a1a1", 1],
  ],
  1458,
  810,
);

export function CvSection() {
  return (
    <section aria-labelledby="cv-title" className="relative overflow-hidden" style={{ background }}>
      <div className="relative mx-auto h-[810px] w-full max-w-[1440px]">
        <Image src="/brand/glass-cv-2.svg" alt="" width={177} height={202} unoptimized className="absolute max-w-none" style={{ left: 574.2, top: 29.44, width: 176.49, height: 201.53 }} />
        <Image src="/brand/glass-cv-1.svg" alt="" width={236} height={269} unoptimized className="absolute max-w-none" style={{ left: 750.38, top: 463.44, width: 235.16, height: 268.53 }} />
        <Image src="/brand/glass-cv-3.svg" alt="" width={177} height={202} unoptimized className="absolute max-w-none" style={{ left: 45.67, top: 530.44, width: 176.49, height: 201.53 }} />

        <div className="group absolute top-[105.44px] left-[70px] h-[599px] w-[749px]">
          <div className="absolute top-0 left-[26px] h-[441px] w-[583px] overflow-hidden rounded-[16px] blur-[2px] transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:-translate-x-3 group-hover:-rotate-2">
            <Image src="/images/cv/back.webp" alt="" fill sizes="583px" className="object-fill" />
            <span className="absolute inset-0 bg-black/25" />
          </div>
          <div
            className="absolute top-[24.88px] left-[159.16px] h-[441.35px] w-[582.74px] origin-top-left rotate-[14.63deg] transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-[11deg]"
          >
            <div className="relative h-full w-full overflow-hidden rounded-[16px] blur-[2px]">
              <Image src="/images/cv/front.webp" alt="Preview of Rakib Khan's CV" fill sizes="583px" className="object-fill" />
              <span className="absolute inset-0 bg-black/[0.18]" />
            </div>
          </div>
          <OutlineButton
            label="Preview"
            href="/cv/rakib-khan-cv.pdf"
            surface="rgba(0,0,0,0.5)"
            className="absolute! top-[280px] left-[261px] w-[226px] border-white/25!"
          />
        </div>

        <div className="absolute top-[174.44px] left-[933px] flex w-[426px] flex-col gap-[30px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[11.16px] leading-[14px] tracking-[1.26px] whitespace-pre text-ink uppercase">
                {"/     my cv"}
              </p>
              <h2 id="cv-title" className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-ink">
                Download My CV
              </h2>
            </div>
            <p className="text-[16px] leading-[20px] text-[#383838]">
              Get a closer look at my skills, experience, and design journey. Download or preview my CV to explore how I
              can add value to your next project!
            </p>
          </div>
          <DownloadCv tone="dark" />
        </div>
      </div>
    </section>
  );
}

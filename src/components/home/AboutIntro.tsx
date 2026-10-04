import Image from "next/image";
import { DiscLink, DownloadCv, Eyebrow, OutlineButton } from "../ui";

// White squares scattered over the intro, relative to the section top.
const squares = [
  [154, 667, 16], [214, 1307, 32], [1147, 604, 8], [401, 535, 16], [805, 667, 28], [813, 1272, 16],
  [1131, 1216, 16], [538, 1216, 8], [154, 1706, 16], [353, 2122, 32], [1147, 1643, 8], [401, 1574, 16],
  [805, 1706, 28], [952, 2087, 16], [1270, 2031, 16], [677, 2031, 8],
] as const;

/** "About me" statement, the scattered squares and the light profile panel. */
export function AboutIntro() {
  return (
    <section aria-labelledby="about-title" className="relative">
      <div className="relative mx-auto h-[2395px] w-full max-w-[1440px]">
        <div className="absolute inset-x-0 top-0 h-[909px] bg-black" />
        <div className="relative flex flex-col items-center gap-[30px] px-[113px] pt-[330px]">
          <Eyebrow className="trim h-[11px] w-full text-center text-[16px] tracking-[0.8px] text-g3">{"/      About Me"}</Eyebrow>
          <h2 id="about-title" className="w-full text-center text-[56px] leading-[67px] tracking-[0.1px] text-g1">
            I build visually striking designs <br />
            <em className="italic">that prioritize seamless user experiences.</em>
          </h2>
          <p className="w-[612px] text-center text-[18px] leading-[22px] tracking-[0.1px] text-g2">
            With 05 years of experience in the design industry I have been helping to bring brands to life through
            thoughtful design that resonates.
          </p>
        </div>
        {squares.map(([x, y, s], i) => (
          <span
            key={i}
            aria-hidden
            className="square-drift absolute bg-white"
            style={{ left: x, top: y, width: s, height: s, animationDelay: `${(i % 5) * -1.3}s` }}
          />
        ))}
      </div>

      <div className="relative overflow-hidden bg-paper">
        <div className="relative mx-auto h-[1046px] w-full max-w-[1440px]">
          <Eyebrow className="trim absolute top-[229.5px] left-10 text-[16px] tracking-[0.8px] text-ink">
            {"/     Profile"}
          </Eyebrow>
          <div className="absolute top-[580.5px] left-10 flex w-[690px] flex-col items-end gap-1 text-ink">
            <p className="text-[48px] leading-[58px] tracking-[0.1px] whitespace-pre italic">{"Hey’ This is  Rakib Khan"}</p>
            <p className="w-full text-[48px] leading-[58px] tracking-[0.1px]">
              For over five years, I have been dedicate{" "}
              <em className="italic">crafting intuitive and engaging digital experiences.</em>
            </p>
          </div>

          <Image
            src="/images/profile-home.webp"
            alt="Portrait of Rakib Khan"
            width={840}
            height={1040}
            sizes="420px"
            className="absolute top-[128px] left-[846px] h-[520px] w-[420px]"
          />
          <div className="absolute top-[698px] left-[846px] flex w-[554px] flex-col gap-10">
            <p className="text-[18px] leading-[28px] tracking-[0.1px] text-ink">
              As a passionate UI/UX designer with a strong background in crafting intuitive and visually compelling
              digital experiences. With expertise in website design, mobile apps, SaaS platforms, branding, and
              interactive prototyping, I transform ideas into engaging user interfaces that drive results.
            </p>
            <div className="flex gap-10">
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

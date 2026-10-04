import Image from "next/image";
import { works } from "@/data/site";
import { OutlineButton } from "../ui";
import { WorkCard } from "./WorkCard";

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative mx-auto w-full max-w-[1440px]">
      <div className="relative h-[810px]">
        <h2 id="work-title" className="sr-only">
          Work
        </h2>
        <Image
          src="/type/work.svg"
          alt=""
          width={1250}
          height={283}
          unoptimized
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: 95.27, top: 264.48 }}
        />
        <Image
          src="/brand/glass-logo-work.svg"
          alt=""
          width={99}
          height={91}
          unoptimized
          className="pointer-events-none absolute max-w-none"
          style={{ left: 622, top: 360, width: 98.13, height: 90.53 }}
        />
      </div>

      <div className="relative mx-auto h-[2970px] w-[1360px]">
        {works.map((w, i) => (
          <WorkCard
            key={w.image}
            {...w}
            className="absolute"
            style={{ left: i % 2 === 0 ? 0 : 690, top: i * 594 }}
          />
        ))}
      </div>

      <div className="mt-32 flex justify-center">
        <OutlineButton label="View All" href="/projects/roofnest" className="w-[226px]" />
      </div>
    </section>
  );
}

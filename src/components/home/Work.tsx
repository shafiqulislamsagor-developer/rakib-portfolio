import { works } from "@/data/site";
import { OutlineButton } from "../ui";
import { WorkCard } from "./WorkCard";
import { WorkTitle } from "./WorkTitle";

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative mx-auto w-full max-w-[1440px]">
      <WorkTitle />

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

      <div data-reveal="up" className="mt-32 flex justify-center">
        <OutlineButton label="View All" href="/projects/roofnest" className="w-[226px]" />
      </div>
    </section>
  );
}

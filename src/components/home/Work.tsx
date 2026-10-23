import { works } from "@/data/site";
import { OutlineButton } from "../ui";
import { WorkCard } from "./WorkCard";
import { WorkTitle } from "./WorkTitle";

/** staggered two-column canvas from the design: 670px cards 20px apart, each one 594px lower */
const columnX = [0, 690];
const rowStep = 594;

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative mx-auto w-full max-w-[1440px]">
      <WorkTitle />

      <div className="relative mx-auto w-[1360px]" style={{ height: works.length * rowStep }}>
        {works.map((w, i) => (
          <WorkCard
            key={w.image}
            {...w}
            className="absolute"
            style={{ left: columnX[i % 2], top: i * rowStep }}
          />
        ))}
      </div>

      <div data-reveal="up" className="mt-32 flex justify-center">
        <OutlineButton label="View All" href="/projects/roofnest" className="w-[226px]" />
      </div>
    </section>
  );
}

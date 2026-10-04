import Image from "next/image";
import { tools } from "@/data/site";
import { Eyebrow } from "../ui";

export function Advantages() {
  return (
    <section aria-labelledby="advantages-title" className="relative mx-auto h-[693.51px] w-[1360px]">
      <div className="flex items-end gap-4 pr-[58px]">
        <div className="flex w-[643px] flex-col gap-2">
          <Eyebrow className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">{"/     Expertise"}</Eyebrow>
          <h2 id="advantages-title" className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1">
            My Advantages
          </h2>
        </div>
        <p className="w-[643px] text-[16px] leading-[20px] text-g2">
          From wireframing to high-fidelity prototyping, I use industry-leading tools like Figma, Framer, Adobe Suite, and
          more to bring ideas to life—ensuring smooth workflows, pixel-perfect designs, and efficient collaboration.
        </p>
      </div>

      <ul className="absolute top-[134px] left-[773px] h-[559.51px] w-[587px]">
        {tools.map((t) => (
          <li
            key={t.name}
            className="bubble absolute size-[150px] rounded-full border border-white/30 bg-white/15 backdrop-blur-[8px]"
            style={{ left: t.x, top: t.y }}
          >
            <Image
              src={t.icon}
              alt=""
              width={Math.round(t.iw)}
              height={Math.round(t.ih)}
              unoptimized
              className="absolute left-1/2 max-w-none -translate-x-1/2"
              style={{ top: t.iy, width: t.iw, height: t.ih }}
            />
            <span
              className={`absolute inset-x-0 text-center font-inter text-[14px] leading-[20px] text-white ${
                t.outline ? "[paint-order:stroke_fill] [-webkit-text-stroke:2px_rgba(255,255,255,0.3)]" : ""
              }`}
              style={{ top: t.iy + t.ih + 8 }}
            >
              {t.name}
            </span>
          </li>
        ))}
      </ul>

      <span
        aria-hidden
        className="pointer-events-none absolute origin-top-left -rotate-[0.68deg] mix-blend-difference"
        style={{
          left: 311.96,
          top: 662.33,
          width: 1301.26,
          height: 126.38,
          background:
            "radial-gradient(56.8% 46.4% at 50% 50%, rgba(40,40,40,0.6) 13%, rgba(2,2,2,0) 100%)",
        }}
      />
    </section>
  );
}

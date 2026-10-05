import { experiences } from "@/data/site";
import { DownloadCv, Eyebrow } from "../ui";

function Table({ columns }: { columns: [number, number] }) {
  const [c1, c2] = columns;
  const head = ["Role", "COMPANY", "yEAR"];
  return (
    <div className="w-full">
      <div className="flex h-[25px]">
        {head.map((h, i) => (
          <div key={h} className="flex flex-col gap-[10px]" style={i < 2 ? { width: [c1, c2][i] } : { flex: 1 }}>
            <span data-reveal="fade" className="text-[12px] leading-[14px] text-g1 uppercase">
              {h}
            </span>
            <span data-reveal="line-x" data-reveal-delay={String(i * 0.1)} className="h-px w-full bg-line" />
          </div>
        ))}
      </div>
      {experiences.map((e, row) => (
        <div key={e.role} className="group relative h-[90.39px]">
          <div data-reveal="up" data-reveal-delay={String(row * 0.06)} className="absolute inset-0">
            <p className="absolute top-[31.5px] left-0 text-[24px] leading-[26.4px] text-g2 transition-colors duration-300 group-hover:text-g5">
              {e.role}
            </p>
            <p
              className="absolute top-[31.5px] text-[24px] leading-[26.4px] text-g2 transition-colors duration-300 group-hover:text-g5"
              style={{ left: c1 }}
            >
              {e.company}
            </p>
            <p className="absolute top-[37.19px] flex items-center gap-1 text-g2" style={{ left: c1 + c2 }}>
              <span className="text-[14px] leading-[16px] tracking-[1.44px]">{e.from}</span>
              <svg aria-hidden width="9" height="10" viewBox="0 0 9 10" fill="none" className="shrink-0">
                <path d="M0 5.5H8M5.2 2.6 8.1 5.5 5.2 8.4" stroke="currentColor" strokeWidth="1.1" />
              </svg>
              <span className="text-[14px] leading-[16px] tracking-[1.44px]">{e.to}</span>
            </p>
          </div>
          <span
            data-reveal="line-x"
            data-reveal-delay={String(0.1 + row * 0.06)}
            className="absolute bottom-0 left-0 h-px w-full bg-line"
          />
        </div>
      ))}
    </div>
  );
}

const intro =
  "I’ve worked on a range of web, mobile, and SaaS projects—bringing ideas to life with clean, user-focused design and real-world experience.";

export function Experience() {
  return (
    <section aria-labelledby="experience-title" className="relative mx-auto flex w-[1360px] justify-between">
      <div className="flex w-[460px] flex-col gap-[30px] pr-[114px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
              {"/     Experience"}
            </Eyebrow>
            <h2
              id="experience-title"
              data-reveal="lines"
              className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
            >
              Experiences
            </h2>
          </div>
          <p data-reveal="lines" data-reveal-delay="0.15" className="text-[16px] leading-[20px] text-g2">
            {intro}
          </p>
        </div>
        <div data-reveal="up" data-reveal-delay="0.25" className="flex">
          <DownloadCv />
        </div>
      </div>
      <div className="w-[900px] pt-[325px]">
        <Table columns={[347.08, 347.08]} />
      </div>
    </section>
  );
}

export function Education() {
  return (
    <section aria-labelledby="education-title" className="relative mx-auto flex w-[1360px] flex-col items-center gap-20">
      <div className="flex flex-col items-center gap-[30px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-2">
            <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
              {"/     education"}
            </Eyebrow>
            <h2
              id="education-title"
              data-reveal="lines"
              className="h-[62px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
            >
              Education &amp; Qualification
            </h2>
          </div>
          <p data-reveal="lines" data-reveal-delay="0.15" className="text-[16px] leading-[20px] text-g2">
            {intro}
          </p>
        </div>
        <div data-reveal="up" data-reveal-delay="0.25" className="flex">
          <DownloadCv />
        </div>
      </div>
      <Table columns={[347.08, 347.08]} />
    </section>
  );
}

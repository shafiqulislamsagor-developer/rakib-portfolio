import Image from "next/image";
import type { TestimonialCard } from "@/lib/design";
import { Eyebrow } from "../kit";

function QuoteMark() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" aria-hidden>
      <path d="M0 36V16C0 9.5 5.5 3 15 0L19.3 3.2C14.6 6.4 12 10.4 11.4 16H20V36Z" fill="currentColor" />
      <path d="M28 36V16C28 9.5 33.5 3 43 0L47.3 3.2C42.6 6.4 40 10.4 39.4 16H48V36Z" fill="currentColor" />
    </svg>
  );
}

type TestimonialsProps = {
  eyebrow: string;
  heading: string;
  intro: string;
  items: TestimonialCard[];
};

export function Testimonials({ eyebrow, heading, intro, items }: TestimonialsProps) {
  const fade = "transition-opacity duration-300 ease-figma-out";
  return (
    <section aria-labelledby="testimonials-title" className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[60px] py-32">
      <div className="flex h-[84px] flex-col gap-2 px-10">
        <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
          {`/     ${eyebrow}`}
        </Eyebrow>
        <div className="flex gap-[430px]">
          <h2
            id="testimonials-title"
            data-reveal="lines"
            className="shrink-0 text-[56px] leading-[61.6px] tracking-[-1.68px] whitespace-nowrap text-g1"
          >
            {heading}
          </h2>
          <p data-reveal="lines" data-reveal-delay="0.15" className="text-[16px] leading-[20px] text-g2">
            {intro}
          </p>
        </div>
      </div>

      <ul className="flex justify-center gap-5">
        {items.map((t, i) => (
          <li
            key={t.name}
            tabIndex={0}
            data-reveal="up"
            data-reveal-delay={String(i * 0.12)}
            className="group relative h-[480px] w-[440px] shrink-0 overflow-hidden rounded-[4px] outline-none"
          >
            {/* default: portrait with name */}
            {t.image ? (
              <Image
                src={t.image}
                alt={`Portrait of ${t.name}`}
                fill
                sizes="440px"
                className={`object-fill ${fade} group-hover:opacity-0 group-focus-visible:opacity-0`}
              />
            ) : (
              // No portrait: the outlined card is the only state, so it shows the quote at rest.
              <span aria-hidden className="absolute inset-0 rounded-[4px] border border-[#777]" />
            )}
            {/* hover variant: outlined card with the quote */}
            <span
              aria-hidden
              className={`absolute inset-0 rounded-[4px] border border-[#777] opacity-0 ${fade} group-hover:opacity-100 group-focus-visible:opacity-100`}
            />
            <div
              className={`absolute inset-0 ${t.image ? `opacity-0 ${fade} group-hover:opacity-100 group-focus-visible:opacity-100` : ""}`}
            >
              <span className="absolute top-[46px] left-10 text-g1">
                <QuoteMark />
              </span>
              <p className="absolute top-[129px] left-10 w-[360px] text-[28px] leading-[1.33] text-g2">{t.quote}</p>
            </div>
            <div className="absolute top-[393px] left-10 w-[228px] tracking-[-0.3px]">
              <div className={`flex flex-col gap-1 ${t.image ? `text-g5 ${fade} group-hover:text-g2` : "text-g2"}`}>
                <p className="h-6 text-[16px] leading-[24px]">{t.name}</p>
                <p className="text-[14px] leading-[1.33]">{t.role}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { ReactNode } from "react";
import { Eyebrow } from "../kit";

/**
 * Opening block of the pages that have no artwork of their own (work index,
 * blog, services, contact, custom pages). It repeats the vocabulary of the
 * drawn sections — the "/     Label" eyebrow, the 56px light-grey heading and
 * a short intro — on the same 1440px canvas, so these pages read as part of
 * the same site rather than as templates bolted on.
 */
export function PageHero({
  eyebrow,
  heading,
  intro,
  children,
}: {
  eyebrow: string;
  heading: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-10 pt-[260px]">
      <div className="flex flex-col gap-2">
        <Eyebrow data-reveal="fade" className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">
          {`/     ${eyebrow}`}
        </Eyebrow>
        <h1
          data-reveal="lines"
          className="max-w-[1000px] text-[56px] leading-[61.6px] tracking-[-1.68px] text-g1"
        >
          {heading}
        </h1>
      </div>
      {intro && (
        <p
          data-reveal="lines"
          data-reveal-delay="0.15"
          className="mt-6 max-w-[670px] text-[18px] leading-[28px] tracking-[0.1px] text-g2"
        >
          {intro}
        </p>
      )}
      {children}
      <span aria-hidden data-reveal="line-x" className="mt-20 block h-px w-full bg-[#4e4e4e]/50" />
    </section>
  );
}

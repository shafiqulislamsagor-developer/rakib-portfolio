import Image from "next/image";
import { testimonials } from "@/data/site";
import { Eyebrow } from "../ui";

export function Testimonials({ variant = "home" }: { variant?: "home" | "about" }) {
  const items = testimonials[variant];
  return (
    <section aria-labelledby="testimonials-title" className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[60px] py-32">
      <div className="flex h-[84px] flex-col gap-2 px-10">
        <Eyebrow className="text-[16px] leading-[14px] tracking-[1.26px] text-g1">{"/     Testimonials"}</Eyebrow>
        <div className="flex gap-[430px]">
          <h2
            id="testimonials-title"
            className="shrink-0 text-[56px] leading-[61.6px] tracking-[-1.68px] whitespace-nowrap text-g1"
          >
            What say my client
          </h2>
          <p className="text-[16px] leading-[20px] text-g2">
            Here&apos;s what some of my clients have said about working with me—real stories from real projects,
            highlighting the value, collaboration, and results delivered through thoughtful design.
          </p>
        </div>
      </div>

      <ul className="flex justify-center gap-5">
        {items.map((t) => (
          <li
            key={t.name}
            className="group relative flex h-[480px] w-[440px] shrink-0 items-end overflow-hidden rounded-[4px] p-10"
          >
            <Image
              src={t.image}
              alt={`Portrait of ${t.name}`}
              fill
              sizes="440px"
              className="object-fill transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
            />
            <div className="relative flex w-[228px] flex-col gap-1 text-g5">
              <p className="h-6 text-[16px] leading-[24px] tracking-[-0.3px]">{t.name}</p>
              <p className="text-[14px] leading-[1.33] tracking-[-0.3px]">{t.role}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

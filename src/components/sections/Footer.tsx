import Image from "next/image";
import Link from "next/link";
import { contact, menuLinks, socialLinks } from "@/data/site";
import { ArrowUpRightSmall } from "../icons";
import { DiscLink } from "../ui";

type FooterProps = {
  variant?: "home" | "inner";
  /** left edge of the link block inside the 1440 frame */
  contentX?: number;
  discX?: number;
  letsTalkX?: number;
};

const letsTalk = {
  home: { src: "/type/lets-talk-home.svg", x: 49.13, y: 572.27, w: 1347, h: 287 },
  inner: { src: "/type/lets-talk-project.svg", x: 45.71, y: 573.3, w: 1354, h: 288 },
};

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-[205px] flex-col gap-[10px]">
      <p className="text-[19px] leading-[27px] text-g2 uppercase">{title}</p>
      <ul className="flex flex-col gap-3 py-[6px] text-[18px] leading-[17px]">{children}</ul>
    </div>
  );
}

const linkCls = "text-[18px] leading-[17px] text-g2 transition-colors hover:text-white";

export function Footer({ variant = "home", contentX, discX, letsTalkX }: FooterProps) {
  const isHome = variant === "home";
  const lt = letsTalk[variant];
  const x = contentX ?? (isHome ? 42 : 35);
  const logo = isHome ? { w: 200, h: 184.51 } : { w: 238.48, h: 220 };
  const linkRowH = logo.h;
  const privacyY = isHome ? 499.51 : 528;

  return (
    <footer id="contact-footer" className="relative overflow-hidden">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[#4e4e4e]/50" />
      <div className="relative mx-auto h-[810px] w-full max-w-[1440px]">
        <div className="absolute top-32 flex w-[1356px] items-start gap-[110px]" style={{ left: x, height: linkRowH }}>
          <div className="flex items-start gap-[254px]">
            <div className="flex w-[320px] flex-col gap-[10px]">
              <p className="text-[19px] leading-[27px] text-g2 uppercase">Get in touch</p>
              <ul className="flex flex-col gap-3 py-[6px] text-[18px] leading-[17px]">
                <li>
                  <a href={`mailto:${contact.email}`} className={linkCls}>
                    {contact.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className={linkCls}>
                    {contact.phone}
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex gap-5">
              <Column title="Menu">
                {menuLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </Column>
              <Column title="Social Media">
                {socialLinks.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noreferrer" className={`group inline-flex items-center gap-2 ${linkCls}`}>
                      {l.label}
                      <ArrowUpRightSmall className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </Column>
            </div>
          </div>
          <Image
            src="/brand/glass-logo-footer.svg"
            alt=""
            width={logo.w}
            height={logo.h}
            unoptimized
            className="shrink-0"
            style={{ width: logo.w, height: logo.h }}
          />
        </div>

        <div
          className="absolute flex w-[1356px] items-center justify-between py-[6px]"
          style={{ left: x, top: privacyY }}
        >
          <div className="flex items-center gap-8">
            <span className="text-[18px] leading-[16.5px] text-g2">©2025</span>
            <span className={`text-[18px] text-g2 ${isHome ? "leading-[1.33]" : "leading-[16.5px]"}`}>
              Privacy | Policy
            </span>
          </div>
          <span className="text-[18px] leading-[16.5px] text-g2">Designed by Rakib Khan®</span>
        </div>

        <h2 className="sr-only">Let’s talk</h2>
        <Image
          src={lt.src}
          alt=""
          width={lt.w}
          height={lt.h}
          unoptimized
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: letsTalkX ?? lt.x, top: lt.y, width: lt.w, height: lt.h }}
        />

        <DiscLink
          label={isHome ? "Get in Touch" : "Contact"}
          href="#contact"
          style={{ left: discX ?? 632, top: 509 }}
        />
      </div>
    </footer>
  );
}

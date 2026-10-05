"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { contact, menuLinks, socialLinks } from "@/data/site";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { ArrowUpRightSmall } from "../icons";
import { useLenisRef } from "../motion/SmoothScroll";
import { SvgType } from "../motion/SvgType";
import { DiscLink } from "../ui";

type FooterProps = {
  variant?: "home" | "inner";
  /** left edge of the link block inside the 1440 frame */
  contentX?: number;
  discX?: number;
  letsTalkX?: number;
};

const letsTalk = {
  home: { name: "letsTalkHome", x: 49.13, y: 572.27 },
  inner: { name: "letsTalkInner", x: 45.71, y: 573.3 },
} as const;

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-[205px] flex-col gap-[10px]">
      <p data-reveal="fade" className="text-[19px] leading-[27px] text-g2 uppercase">
        {title}
      </p>
      <ul data-reveal="stagger" className="flex flex-col gap-3 py-[6px] text-[18px] leading-[17px]">
        {children}
      </ul>
    </div>
  );
}

const linkCls = "text-[18px] leading-[17px] text-g2 transition-colors hover:text-white";

export function Footer({ variant = "home", contentX, discX, letsTalkX }: FooterProps) {
  const root = useRef<HTMLElement>(null);
  const logoBtn = useRef<HTMLButtonElement>(null);
  const lenisRef = useLenisRef();
  const isHome = variant === "home";
  const lt = letsTalk[variant];
  const x = contentX ?? (isHome ? 42 : 35);
  const logo = isHome ? { w: 200, h: 184.51 } : { w: 238.48, h: 220 };
  const linkRowH = logo.h;
  const privacyY = isHome ? 499.51 : 528;
  // the logo cycles through the same variants as the hero logo, scaled to its size
  const k = logo.w / 344.7;
  const cycleVars = {
    "--logo-ax": `${72.35 * k}px`,
    "--logo-ay": `${-80.73 * k}px`,
    "--logo-bx": `${61.51 * k}px`,
    "--logo-by": `${51.27 * k}px`,
  } as CSSProperties;

  useGSAP(
    () => {
      if (!motionEnabled()) return;
      const q = gsap.utils.selector(root);
      const type = q("svg[data-svgtype]")[0];
      gsap.from(q("svg[data-svgtype] [data-glyph]"), {
        y: 320,
        duration: 1.5,
        ease: "power4.out",
        stagger: 0.06,
        scrollTrigger: { trigger: type, start: "top 96%", once: true },
      });

      // the logo leans toward the pointer while hovered
      const btn = logoBtn.current!;
      gsap.set(btn, { transformPerspective: 900 });
      const rotY = gsap.quickTo(btn, "rotationY", { duration: 0.6, ease: "power3.out" });
      const rotX = gsap.quickTo(btn, "rotationX", { duration: 0.6, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        rotY(((e.clientX - r.left) / r.width - 0.5) * 30);
        rotX(-((e.clientY - r.top) / r.height - 0.5) * 30);
      };
      const onLeave = () => {
        rotY(0);
        rotX(0);
      };
      btn.addEventListener("pointermove", onMove);
      btn.addEventListener("pointerleave", onLeave);
      return () => {
        btn.removeEventListener("pointermove", onMove);
        btn.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root },
  );

  // design interaction: clicking the logo scrolls back to the top
  function toTop() {
    const lenis = lenisRef?.current;
    if (lenis) lenis.scrollTo(0, { duration: 2.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer ref={root} id="contact-footer" className="relative overflow-hidden">
      <span aria-hidden data-reveal="line-x" className="absolute inset-x-0 top-0 h-px bg-[#4e4e4e]/50" />
      <div className="relative mx-auto h-[810px] w-full max-w-[1440px]">
        <div className="absolute top-32 flex w-[1356px] items-start gap-[110px]" style={{ left: x, height: linkRowH }}>
          <div className="flex items-start gap-[254px]">
            <div className="flex w-[320px] flex-col gap-[10px]">
              <p data-reveal="fade" className="text-[19px] leading-[27px] text-g2 uppercase">
                Get in touch
              </p>
              <ul data-reveal="stagger" className="flex flex-col gap-3 py-[6px] text-[18px] leading-[17px]">
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
          <button
            ref={logoBtn}
            type="button"
            onClick={toTop}
            aria-label="Back to top"
            data-reveal="fade"
            className="shrink-0 cursor-pointer"
            style={{ width: logo.w, height: logo.h }}
          >
            <span className="logo-cycle block size-full" style={cycleVars}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static vector, no optimisation needed */}
              <img src="/brand/glass-logo-footer.svg" alt="" width={logo.w} height={logo.h} className="block size-full" />
            </span>
          </button>
        </div>

        <div
          data-reveal="fade"
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
        <SvgType
          name={lt.name}
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: letsTalkX ?? lt.x, top: lt.y }}
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

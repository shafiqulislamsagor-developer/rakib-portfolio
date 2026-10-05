"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navColumns, navProjects } from "@/data/site";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";
import { CloseLines, MenuLines } from "./icons";
import { useLenisRef } from "./motion/SmoothScroll";
import { Svg } from "./Svg";
import { OutlineButton } from "./ui";

type NavProps = {
  /** "home" uses the compact mark, inner pages use the mark with the ® sign */
  variant?: "home" | "inner";
};

export function Nav({ variant = "inner" }: NavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenisRef = useLenisRef();
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const lenis = lenisRef?.current;
    const prev = document.body.style.overflow;
    if (lenis) lenis.stop();
    else document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (lenis) lenis.start();
      else document.body.style.overflow = prev;
    };
  }, [open, lenisRef]);

  // header fades in after the page intro has started
  useGSAP(
    () => {
      if (!motionEnabled()) return;
      gsap.fromTo(header.current, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.9 });
    },
    { scope: header },
  );

  const isHome = variant === "home";

  return (
    <>
      <header
        ref={header}
        data-intro
        className={`absolute inset-x-0 top-10 z-40 mx-auto flex w-full max-w-[1440px] items-center justify-between px-10 ${
          isHome ? "h-12" : "h-[62.73px]"
        }`}
      >
        <Link href="/" aria-label="Rakib Khan — home" className="block">
          {isHome ? (
            <Svg src="/brand/logo.svg" width={42} height={48} style={{ width: 41.52, height: 48 }} />
          ) : (
            <Svg src="/brand/logo-r.svg" width={68} height={63} style={{ width: 68, height: 62.73 }} />
          )}
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="group relative flex h-12 w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-[4px] bg-ink/40 text-white backdrop-blur-[10px]"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-[4px] border border-white/0 transition-colors duration-300 ease-figma-out group-hover:border-white"
          />
          <span aria-hidden className="btn-fill absolute inset-0 rounded-[4px] bg-white" />
          <MenuLines className="relative transition-colors duration-300 ease-figma-out group-hover:text-ink" />
        </button>
      </header>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        data-lenis-prevent
        className={`fixed inset-0 z-50 transition-[visibility] duration-500 ${open ? "visible" : "invisible"}`}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="pointer-events-none relative mx-auto w-full max-w-[1440px] px-10 pt-5">
          <div
            className={`pointer-events-auto relative h-[624px] w-full overflow-hidden rounded-[8px] bg-mist backdrop-blur-[20px] transition-[clip-path,opacity] duration-700 ease-[var(--ease-out-soft)] ${
              open ? "opacity-100 [clip-path:inset(0_0_0_0_round_8px)]" : "opacity-0 [clip-path:inset(0_0_100%_0_round_8px)]"
            }`}
          >
            <div className="flex items-center justify-between p-5">
              <Link href="/" aria-label="Rakib Khan — home" onClick={() => setOpen(false)}>
                <Svg src="/brand/logo-dark.svg" width={42} height={48} style={{ width: 41.52, height: 48 }} />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="relative flex h-12 w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-[4px] border border-ink bg-ink text-white backdrop-blur-[10px] transition-colors duration-300 ease-figma-out hover:bg-white hover:text-ink focus-visible:bg-white focus-visible:text-ink"
              >
                <CloseLines className="relative" />
              </button>
            </div>

            <div className="mt-4 flex items-end justify-between pr-5">
              <nav aria-label="Primary" className="flex gap-[49px] px-5">
                {navColumns.map((col, ci) => (
                  <ul key={ci} className="flex flex-col">
                    {col.map((item, i) => {
                      const active = item.href === pathname;
                      return (
                        <li
                          key={item.label}
                          className={`transition-[opacity,transform] duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                          style={{ transitionDelay: open ? `${150 + (ci * 4 + i) * 50}ms` : "0ms" }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`inline-flex h-10 items-center border-b pr-4 font-sora text-[20px] leading-[24px] font-semibold transition-colors duration-300 ease-figma-out ${
                              active
                                ? "border-[#010205] text-[#010205]"
                                : "border-transparent text-[#808082] hover:border-[#010205] hover:text-[#010205] focus-visible:border-[#010205] focus-visible:text-[#010205]"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </nav>
              <OutlineButton
                label="Launch Project"
                href="/upload"
                tone="dark"
                className="w-[226px]"
              />
            </div>

            <div className="mt-6 flex gap-5 p-5">
              {navProjects.map((p, i) => (
                <Link
                  key={p.index}
                  href={p.href}
                  onClick={() => setOpen(false)}
                  className={`group relative flex h-[292px] shrink-0 items-end overflow-hidden rounded-[4px] bg-[#d9d9d9] px-[19px] py-5 transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] ${
                    open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                  style={{ width: p.w, transitionDelay: open ? `${250 + i * 80}ms` : "0ms" }}
                >
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="427px"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.2) 100%)" }}
                  />
                  <span className="relative flex items-start gap-4 text-white">
                    <span className="trim text-[14px] whitespace-pre [--lh:1.2em]">{`/  ${p.index}`}</span>
                    <span className="trim w-[231px] text-[18px] capitalize [--lh:1.2em]">{p.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { gsap, motionEnabled, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Scroll reveals declared in markup with `data-reveal`:
 *   lines   – each text line rises out of a mask (split, then restored)
 *   up      – fades in while moving up
 *   fade    – fades in
 *   clip    – an image frame opens from the bottom while the image settles
 *   wipe    – uncovers from left to right (connectors)
 *   line-x  – a divider draws from the left
 *   line-y  – a divider draws from the top
 *   pop     – scales in (call-to-action discs)
 *   stagger – direct children rise one after another
 * Optional `data-reveal-delay` (seconds). Every animation ends on the exact
 * design state; with reduced motion nothing is touched.
 */
export function Reveals() {
  const pathname = usePathname();

  useGSAP(
    (_ctx, contextSafe) => {
      if (!motionEnabled()) return;
      const all = (type: string) => gsap.utils.toArray<HTMLElement>(`[data-reveal="${type}"]`);
      const delayOf = (el: Element) => parseFloat(el.getAttribute("data-reveal-delay") || "0");
      const start = "top 88%";

      for (const el of all("up")) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", delay: delayOf(el), scrollTrigger: { trigger: el, start, once: true } },
        );
      }
      for (const el of all("fade")) {
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.2, ease: "power2.out", delay: delayOf(el), scrollTrigger: { trigger: el, start, once: true } },
        );
      }
      for (const el of all("pop")) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.3 },
          { autoAlpha: 1, scale: 1, duration: 1, ease: "back.out(1.7)", delay: delayOf(el), scrollTrigger: { trigger: el, start, once: true }, clearProps: "transform" },
        );
      }
      for (const el of all("line-x")) {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "0% 50%" },
          { scaleX: 1, duration: 1.3, ease: "power4.inOut", delay: delayOf(el), scrollTrigger: { trigger: el, start: "top 92%", once: true } },
        );
      }
      for (const el of all("line-y")) {
        gsap.fromTo(
          el,
          { scaleY: 0, transformOrigin: "50% 0%" },
          { scaleY: 1, duration: 1.3, ease: "power4.inOut", delay: delayOf(el), scrollTrigger: { trigger: el, start: "top 92%", once: true } },
        );
      }
      for (const el of all("wipe")) {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power3.inOut", delay: delayOf(el), clearProps: "clipPath", scrollTrigger: { trigger: el, start, once: true } },
        );
      }
      for (const el of all("clip")) {
        const img = el.querySelector("img, video");
        const tl = gsap.timeline({ delay: delayOf(el), scrollTrigger: { trigger: el, start, once: true } });
        tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut", clearProps: "clipPath" });
        if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "power3.out", clearProps: "transform" }, 0);
      }
      for (const el of all("stagger")) {
        gsap.fromTo(
          el.children,
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.08, delay: delayOf(el), scrollTrigger: { trigger: el, start, once: true } },
        );
      }

      const lineEls = all("lines");
      if (lineEls.length) gsap.set(lineEls, { autoAlpha: 0 });
      const splitAll = contextSafe!(() => {
        for (const el of lineEls) {
          const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "reveal-line" });
          gsap.set(el, { autoAlpha: 1 });
          gsap.from(split.lines, {
            yPercent: 115,
            rotate: 2,
            transformOrigin: "0% 0%",
            duration: 1.4,
            ease: "power4.out",
            stagger: 0.1,
            delay: delayOf(el),
            scrollTrigger: { trigger: el, start, once: true },
            onComplete: () => split.revert(),
          });
        }
        ScrollTrigger.refresh();
      });
      // line breaks depend on the final font
      if (document.fonts?.status === "loaded") splitAll();
      else document.fonts.ready.then(splitAll);

      ScrollTrigger.refresh();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}

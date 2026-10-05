"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { gsap, motionEnabled, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/** Ref to the page's Lenis instance (its value is null when motion is reduced). Read it in effects/handlers. */
export function useLenisRef() {
  return useContext(LenisContext);
}

/** Smooth scrolling (Lenis) driven by the GSAP ticker so ScrollTrigger stays in sync. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!motionEnabled()) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // same-page anchors glide instead of jumping (capture phase: runs before next/link,
    // which then sees the prevented default and leaves the scrolling to Lenis)
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.querySelector(decodeURIComponent(url.hash));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { duration: 1.6 });
    };
    document.addEventListener("click", onClick, true);

    // layout can change once web fonts arrive
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      document.removeEventListener("click", onClick, true);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // new page: start at the top (or at the requested section)
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.start();
    const hash = location.hash ? document.querySelector(decodeURIComponent(location.hash)) : null;
    if (hash) lenis.scrollTo(hash as HTMLElement, { immediate: true });
    else lenis.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}

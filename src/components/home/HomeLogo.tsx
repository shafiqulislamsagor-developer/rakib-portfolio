"use client";

import { useRef } from "react";
import { gsap, motionEnabled, useGSAP } from "@/lib/gsap";

// Slots of the glass logo in the design, relative to the top of the page canvas.
const HERO = { x: 547.65, y: 192.73 };
const SERVICES = { x: 87.79, y: 1716.73 };
// control point of the flight curve: drifts right before swinging into the services slot
const CTRL = { x: 900, y: 900 };

/**
 * The hero's glass logo. It keeps cycling through its component variants, enters
 * like Atoll's 3D object on load and, while scrolling, travels down along a curve
 * into its place next to "What I do" (comment: "Logo will go to under sections").
 */
export function HomeLogo() {
  const wrap = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!motionEnabled()) return;
    gsap.fromTo(
      wrap.current,
      { autoAlpha: 0, rotation: 90, scale: 0.7, y: 280 },
      { autoAlpha: 1, rotation: 0, scale: 1, y: 0, duration: 1.7, ease: "power4.out", delay: 0.3 },
    );

    const p1 = { x: CTRL.x - HERO.x, y: CTRL.y - HERO.y };
    const p2 = { x: SERVICES.x - HERO.x, y: SERVICES.y - HERO.y };
    const path = { p: 0 };
    const setX = gsap.quickSetter(flight.current, "x", "px");
    const setY = gsap.quickSetter(flight.current, "y", "px");
    const place = () => {
      const p = path.p;
      const b = 2 * (1 - p) * p;
      const c = p * p;
      setX(b * p1.x + c * p2.x);
      setY(b * p1.y + c * p2.y);
    };
    const services = document.getElementById("services");
    gsap
      .timeline({
        scrollTrigger: {
          start: 0,
          end: () => (services ? services.getBoundingClientRect().top + window.scrollY : 1456),
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      })
      .to(path, { p: 1, duration: 1, ease: "none", onUpdate: place }, 0)
      .to(flight.current, { rotation: -9, scale: 1.08, duration: 0.5, ease: "sine.inOut" }, 0)
      .to(flight.current, { rotation: 0, scale: 1, duration: 0.5, ease: "sine.inOut" }, 0.5);

    // leans toward the pointer
    gsap.set(tilt.current, { transformPerspective: 1200 });
    const rotY = gsap.quickTo(tilt.current, "rotationY", { duration: 0.8, ease: "power3.out" });
    const rotX = gsap.quickTo(tilt.current, "rotationX", { duration: 0.8, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      rotY((e.clientX / window.innerWidth - 0.5) * 14);
      rotX(-(e.clientY / window.innerHeight - 0.5) * 10);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto h-full max-w-[1440px]">
      <div ref={wrap} data-intro className="absolute" style={{ left: HERO.x, top: HERO.y, width: 344.7, height: 398.53 }}>
        <div ref={flight} className="size-full">
          <div ref={tilt} className="size-full">
            <div className="logo-cycle size-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- static vector, no optimisation needed */}
              <img src="/brand/logo-glass.svg" alt="" width={345} height={399} className="block size-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

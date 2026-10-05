"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** True when the visitor allows motion (set on <html> before first paint). */
export function motionEnabled() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion");
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

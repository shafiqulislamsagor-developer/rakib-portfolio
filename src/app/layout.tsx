import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import localFont from "next/font/local";
import { Reveals } from "@/components/motion/Reveals";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./globals.css";

// Segoe UI is the design font. It ships with Windows and is used from the
// system there; Selawik is Microsoft's metric-compatible open-source
// fallback for other platforms.
const selawik = localFont({
  src: [
    { path: "../fonts/selawik/selawk.woff2", weight: "400", style: "normal" },
    { path: "../fonts/selawik/selawksb.woff2", weight: "600", style: "normal" },
    { path: "../fonts/selawik/selawkb.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-selawik",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-google",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-sora-google",
  display: "swap",
});


// Runs before first paint: scales the 1440px canvas down on narrower screens and
// turns animations on unless the visitor prefers reduced motion.
const bootScript = `(function(){var d=document.documentElement;function f(){d.style.zoom="1";var w=d.clientWidth;d.style.zoom=String(Math.min(1,w/1440))}f();addEventListener("resize",f);try{if(matchMedia("(prefers-reduced-motion: no-preference)").matches)d.classList.add("motion")}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Rakib Khan — UI/UX Designer",
    template: "%s — Rakib Khan",
  },
  description:
    "Rakib Khan is a UI/UX designer crafting websites, mobile apps, SaaS platforms and brand identities.",
};

export const viewport: Viewport = {
  themeColor: "#020202",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${selawik.variable} ${inter.variable} ${sora.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <SmoothScroll>
          {children}
          <Reveals />
        </SmoothScroll>
      </body>
    </html>
  );
}

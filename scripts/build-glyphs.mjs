// Splits the outlined display-type SVGs in public/type into per-letter path
// groups (src/data/glyphs.ts) so the headings can be animated letter by letter.
// Run after re-exporting any of the type SVGs from Figma: `npm run glyphs`.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../public/type/", import.meta.url);
const OUT = new URL("../src/data/glyphs.ts", import.meta.url);

const names = {
  rakibkhan: "rakibkhan.svg",
  uiuxdesigner: "uiuxdesigner.svg",
  work: "work.svg",
  whyConsider: "why-consider-me.svg",
  letsTalkHome: "lets-talk-home.svg",
  letsTalkInner: "lets-talk-project.svg",
  about: "about.svg",
  roofnest: "roofnest.svg",
};

// approximate bounding box of an absolute-command path (control points included)
function bbox(d) {
  const t = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  const add = (a, c) => {
    b.x0 = Math.min(b.x0, a);
    b.x1 = Math.max(b.x1, a);
    b.y0 = Math.min(b.y0, c);
    b.y1 = Math.max(b.y1, c);
  };
  const num = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    switch (cmd) {
      case "M":
      case "L":
      case "T":
        x = num();
        y = num();
        add(x, y);
        break;
      case "H":
        x = num();
        add(x, y);
        break;
      case "V":
        y = num();
        add(x, y);
        break;
      case "C": {
        add(num(), num());
        add(num(), num());
        x = num();
        y = num();
        add(x, y);
        break;
      }
      case "S":
      case "Q": {
        add(num(), num());
        x = num();
        y = num();
        add(x, y);
        break;
      }
      case "Z":
      case "z":
        break;
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return b;
}

const round = (v) => Math.round(v * 100) / 100;
const out = {};

for (const [key, file] of Object.entries(names)) {
  const svg = readFileSync(new URL(file, SRC), "utf8");
  const w = +svg.match(/width="([\d.]+)"/)[1];
  const h = +svg.match(/height="([\d.]+)"/)[1];
  const paths = [...svg.matchAll(/<path d="([^"]+)" fill="([^"]+)"\/>/g)].map((m) => ({ d: m[1], fill: m[2] }));
  const g = svg.match(/<linearGradient[^>]*x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
  const stops = [...svg.matchAll(/<stop(?: offset="([\d.]+)")? stop-color="([^"]+)"\/>/g)].map((m) => [+(m[1] || 0), m[2]]);

  // every fill layer has the same contours; group them into letters by horizontal overlap
  const layers = paths.map((p) => p.d.split(/(?=M)/));
  const subs = layers[0].map((d, idx) => ({ idx, b: bbox(d) })).sort((a, b) => a.b.x0 - b.b.x0);
  const groups = [];
  for (const sp of subs) {
    const last = groups[groups.length - 1];
    const width = sp.b.x1 - sp.b.x0;
    if (last && Math.min(last.x1, sp.b.x1) - Math.max(last.x0, sp.b.x0) > 0.4 * width) {
      last.items.push(sp.idx);
      last.x0 = Math.min(last.x0, sp.b.x0);
      last.x1 = Math.max(last.x1, sp.b.x1);
      last.y0 = Math.min(last.y0, sp.b.y0);
      last.y1 = Math.max(last.y1, sp.b.y1);
    } else {
      groups.push({ items: [sp.idx], ...sp.b });
    }
  }

  out[key] = {
    w,
    h,
    grad: { x1: +g[1], y1: +g[2], x2: +g[3], y2: +g[4], stops },
    layers: paths.map((p) => (p.fill.startsWith("url") ? "grad" : p.fill)),
    glyphs: groups.map((gr) => ({
      box: [round(gr.x0), round(gr.y0), round(gr.x1), round(gr.y1)],
      d: layers.map((l) => gr.items.sort((a, b) => a - b).map((i) => l[i]).join("")),
    })),
  };
  console.log(`${key}: ${groups.length} letters`);
}

writeFileSync(
  OUT,
  `// Generated from public/type/*.svg by scripts/build-glyphs.mjs: outlined display type split into letters for animation.
export type GlyphSet = { w: number; h: number; grad: { x1: number; y1: number; x2: number; y2: number; stops: [number, string][] }; layers: string[]; glyphs: { box: [number, number, number, number]; d: string[] }[] };

export const glyphSets = ${JSON.stringify(out)} satisfies Record<string, GlyphSet>;

export type GlyphName = keyof typeof glyphSets;
`,
);

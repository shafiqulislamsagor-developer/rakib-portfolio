/*
 * Colour themes. Each preset keeps the original design's lightness and
 * chroma relationships (so contrast stays the same) and only changes the hue.
 * "violet" is the original brand and emits no overrides at all.
 */

// lightL: light-mode primary lightness, tuned per hue so button text keeps at
// least the original violet's contrast (≥ 3.8:1). Checked in tests/theme.test.ts.
export const THEME_PRESETS = [
  { key: "violet", label: "Violet", hue: 295, chroma: 1, lightL: 0.62 },
  { key: "indigo", label: "Indigo", hue: 272, chroma: 1, lightL: 0.61 },
  { key: "blue", label: "Blue", hue: 255, chroma: 1, lightL: 0.605 },
  { key: "sky", label: "Sky", hue: 232, chroma: 0.85, lightL: 0.58 },
  { key: "teal", label: "Teal", hue: 185, chroma: 0.75, lightL: 0.57 },
  { key: "emerald", label: "Emerald", hue: 158, chroma: 0.85, lightL: 0.575 },
  { key: "amber", label: "Amber", hue: 70, chroma: 0.85, lightL: 0.605 },
  { key: "orange", label: "Orange", hue: 45, chroma: 1, lightL: 0.62 },
  { key: "rose", label: "Rose", hue: 12, chroma: 1, lightL: 0.62 },
  { key: "pink", label: "Pink", hue: 345, chroma: 1, lightL: 0.62 },
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number]["key"];
export const THEME_PRESET_KEYS = THEME_PRESETS.map((preset) => preset.key) as [ThemePreset, ...ThemePreset[]];
export const DEFAULT_THEME_PRESET: ThemePreset = "violet";

export function getThemePreset(key: string | undefined) {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? THEME_PRESETS[0];
}

const wrap = (hue: number) => ((Math.round(hue) % 360) + 360) % 360;
const oklch = (l: number, c: number, h: number) => `oklch(${l} ${Number(c.toFixed(3))} ${wrap(h)})`;

/** The brand colours a preset resolves to (OKLCH strings), shared by CSS and image generation. */
export function themeColors(key: string | undefined) {
  const { hue: h, chroma: k, lightL } = getThemePreset(key);
  const n = h - 6; // neutrals sit slightly cooler than the accent, as in the original palette
  return {
    light: {
      "--background": oklch(0.985, 0.008, h - 3),
      "--foreground": oklch(0.19, 0.025, n),
      "--card": oklch(0.998, 0.004, h - 3),
      "--card-foreground": oklch(0.19, 0.025, n),
      "--popover": oklch(0.998, 0.004, h - 3),
      "--popover-foreground": oklch(0.32, 0.025, n),
      "--primary": oklch(lightL, 0.19 * k, h),
      "--primary-foreground": oklch(0.99, 0.005, h - 3),
      "--secondary": oklch(0.965, 0.012, h - 3),
      "--muted": oklch(0.955, 0.012, h - 3),
      "--muted-foreground": oklch(0.47, 0.035, n),
      "--accent": oklch(0.94, 0.035, h - 3),
      "--border": oklch(0.89, 0.02, h - 3),
      "--input": oklch(0.97, 0.012, h - 3),
      "--ring": oklch(lightL, 0.19 * k, h),
    },
    dark: {
      "--background": oklch(0.14, 0.025, h - 7),
      "--foreground": oklch(0.94, 0.012, h - 3),
      "--card": oklch(0.18, 0.03, h - 7),
      "--card-foreground": oklch(0.94, 0.012, h - 3),
      "--popover": oklch(0.18, 0.034, n),
      "--popover-foreground": oklch(0.76, 0.025, h - 3),
      "--primary": oklch(0.76, 0.17 * k, h),
      "--primary-foreground": oklch(0.14, 0.025, n),
      "--secondary": oklch(0.2, 0.03, n),
      "--muted": oklch(0.205, 0.028, n),
      "--muted-foreground": oklch(0.68, 0.03, h - 3),
      "--accent": oklch(0.235, 0.055, h - 3),
      "--border": oklch(0.275, 0.04, n),
      "--input": oklch(0.205, 0.03, n),
      "--ring": oklch(0.76, 0.17 * k, h),
    },
    // Footer, intro curtain and other always-dark brand surfaces.
    brand: {
      "--brand-deep": oklch(0.17, 0.05, h),
      "--brand-darker": oklch(0.155, 0.045, h),
      "--brand-ink": oklch(0.18, 0.05, h),
      "--brand-mid": oklch(0.33, 0.13 * k, h),
      "--brand-strong": oklch(0.54, 0.25 * k, h),
      "--brand-glow": oklch(0.63, 0.25 * k, h),
      "--brand-light": oklch(0.72, 0.18 * k, h),
      "--brand-soft": oklch(0.81, 0.1 * k, h),
      "--brand-softer": oklch(0.89, 0.05, h),
      "--brand-alt": oklch(0.83, 0.12 * k, h + 30),
      "--brand-alt-strong": oklch(0.67, 0.26 * k, h + 30),
    },
  };
}

/**
 * CSS that applies a preset. Selectors are more specific than the defaults
 * in globals.css (html:root / html.dark), so they win regardless of order.
 * Returns null for the original violet theme.
 */
export function themeCss(key: string | undefined) {
  if (!key || getThemePreset(key).key === DEFAULT_THEME_PRESET) return null;
  const colors = themeColors(key);
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([name, value]) => `${name}:${value}`)
      .join(";");
  const { hue, chroma } = getThemePreset(key);
  // Printing always uses the light palette plus a darkened accent, whatever
  // theme the visitor is on (see the @media print rules in app/globals.css).
  const printAccent = `--print-accent:oklch(0.42 ${Number((0.17 * chroma).toFixed(3))} ${wrap(hue)})`;
  return (
    `html:root{${block(colors.light)};${block(colors.brand)}}html.dark{${block(colors.dark)}}` +
    `@media print{html:root{${printAccent}}html.dark:root{${block(colors.light)};${printAccent}}}`
  );
}

/** OKLCH → sRGB hex (with gamut clipping), for places that cannot use CSS colours (OG image, manifest). */
export function oklchToHex(value: string) {
  const match = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(value);
  if (!match) return "#000000";
  const [l, c, h] = match.slice(1).map(Number);
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return (
    "#" +
    linear
      .map((channel) => {
        const clipped = Math.min(1, Math.max(0, channel));
        const srgb = clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
        return Math.round(srgb * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

/** Hex swatches for the admin picker and image generation. */
export function themeSwatch(key: string | undefined) {
  const colors = themeColors(key);
  return {
    light: oklchToHex(colors.light["--primary"]),
    dark: oklchToHex(colors.dark["--primary"]),
    deep: oklchToHex(colors.brand["--brand-deep"]),
    strong: oklchToHex(colors.brand["--brand-strong"]),
    soft: oklchToHex(colors.brand["--brand-soft"]),
    softer: oklchToHex(colors.brand["--brand-softer"]),
  };
}

/** Hex colours for the OG image and web manifest; the original violet keeps its exact values. */
export function brandHexColors(key: string | undefined) {
  if (getThemePreset(key).key === DEFAULT_THEME_PRESET) {
    return { deep: "#140b24", strong: "#6d28d9", mid: "#3b176b", border: "#a78bfa", soft: "#c4b5fd", muted: "#a99bc4", text: "#f3f0ff", primary: "#8b5cf6" };
  }
  const { hue: h, chroma: k, lightL } = getThemePreset(key);
  const swatch = themeSwatch(key);
  return {
    deep: swatch.deep,
    strong: oklchToHex(oklch(0.49, 0.24 * k, h)),
    mid: oklchToHex(oklch(0.33, 0.13 * k, h)),
    border: oklchToHex(oklch(0.71, 0.14 * k, h)),
    soft: swatch.soft,
    muted: oklchToHex(oklch(0.72, 0.04, h)),
    text: oklchToHex(oklch(0.96, 0.02, h)),
    primary: oklchToHex(oklch(lightL, 0.19 * k, h)),
  };
}

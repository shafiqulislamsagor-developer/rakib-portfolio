import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/data/defaults";
import { siteSettingsSchema } from "@/lib/validation/content";
import { THEME_PRESETS, brandHexColors, oklchToHex, themeColors, themeCss, themeSwatch } from "@/lib/theme";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

describe("colour themes", () => {
  it("offers ten distinct presets with violet as the original", () => {
    expect(THEME_PRESETS).toHaveLength(10);
    expect(new Set(THEME_PRESETS.map((preset) => preset.key)).size).toBe(10);
    expect(new Set(THEME_PRESETS.map((preset) => themeSwatch(preset.key).light)).size).toBe(10);
    expect(defaultSettings.theme.preset).toBe("violet");
  });

  it("leaves the original violet design untouched", () => {
    expect(themeCss("violet")).toBeNull();
    expect(themeCss(undefined)).toBeNull();
    expect(themeCss("not-a-theme")).toBeNull();
    expect(brandHexColors("violet").deep).toBe("#140b24");
  });

  it("generates overrides that beat globals.css for every other preset", () => {
    for (const preset of THEME_PRESETS.filter((item) => item.key !== "violet")) {
      const css = themeCss(preset.key)!;
      expect(css, preset.key).toMatch(/^html:root\{--background:oklch\(/);
      expect(css).toContain("html.dark{");
      expect(css).toContain(`--primary:oklch(${preset.lightL} `);
      expect(css).toContain("--brand-deep:");
      expect(css).not.toMatch(/NaN|undefined|<|>/);
    }
  });

  it("keeps button text at least as readable as the original in both modes", () => {
    for (const preset of THEME_PRESETS) {
      const colors = themeColors(preset.key);
      const light = contrast(oklchToHex(colors.light["--primary"]), oklchToHex(colors.light["--primary-foreground"]));
      const dark = contrast(oklchToHex(colors.dark["--primary"]), oklchToHex(colors.dark["--primary-foreground"]));
      expect(light, `${preset.key} light`).toBeGreaterThanOrEqual(3.8);
      expect(dark, `${preset.key} dark`).toBeGreaterThanOrEqual(7);
    }
  });

  it("converts OKLCH to hex and clips out-of-gamut colours", () => {
    expect(oklchToHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(oklchToHex("oklch(0 0 0)")).toBe("#000000");
    expect(oklchToHex("oklch(0.7 0.4 140)")).toMatch(/^#[0-9a-f]{6}$/);
    for (const preset of THEME_PRESETS) {
      for (const value of Object.values(brandHexColors(preset.key))) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("validates the preset in settings", () => {
    expect(siteSettingsSchema.safeParse({ ...defaultSettings, theme: { defaultMode: "dark", preset: "teal" } }).success).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...defaultSettings, theme: { defaultMode: "dark", preset: "neon" } }).success).toBe(false);
  });
});

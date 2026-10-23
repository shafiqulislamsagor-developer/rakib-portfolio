import { getProfile, getSiteSettings } from "@/lib/content/public";
import { brandHexColors } from "@/lib/theme";
import { ImageResponse } from "next/og";

export const alt = "Developer portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OpenGraphImage() {
  const [settings, profile] = await Promise.all([getSiteSettings(), getProfile()]);
  const highlight = profile.headlineHighlight ? ` ${profile.headlineHighlight}` : "";
  const brand = brandHexColors(settings.theme.preset);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: brand.text,
          backgroundColor: brand.deep,
          backgroundImage:
            `radial-gradient(circle at 85% 10%, ${brand.strong} 0%, transparent 38%), radial-gradient(circle at 10% 95%, ${brand.mid} 0%, transparent 40%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 25 }}>
          <div
            style={{
              display: "flex",
              width: 58,
              height: 58,
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${brand.border}`,
              borderRadius: 16,
              color: brand.soft,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {settings.logoText || "<S/>"}
          </div>
          {profile.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: brand.soft, fontSize: 21, letterSpacing: 5, textTransform: "uppercase" }}>
            {profile.title}
          </div>
          <div style={{ maxWidth: 1000, marginTop: 24, fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -3 }}>
            {`${profile.headline}${highlight}`}
          </div>
        </div>
        <div style={{ color: brand.muted, fontSize: 21 }}>{profile.heroCode.craft.concat(profile.heroCode.backend || []).join(" · ")}</div>
      </div>
    ),
    size
  );
}

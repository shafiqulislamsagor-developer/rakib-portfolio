import type { CSSProperties } from "react";
import { glyphSets, type GlyphName } from "@/data/glyphs";

/**
 * Outlined display type rendered inline, one <g data-glyph> per letter so the
 * letters can be animated individually. Renders exactly like the exported SVG.
 */
export function SvgType({
  name,
  className,
  style,
  ...rest
}: { name: GlyphName; className?: string; style?: CSSProperties } & Record<`data-${string}`, string | boolean | undefined>) {
  const set = glyphSets[name];
  const gid = `type-grad-${name}`;
  return (
    <svg
      width={set.w}
      height={set.h}
      viewBox={`0 0 ${set.w} ${set.h}`}
      fill="none"
      aria-hidden
      className={className}
      style={style}
      data-svgtype={name}
      {...rest}
    >
      <defs>
        <linearGradient id={gid} x1={set.grad.x1} y1={set.grad.y1} x2={set.grad.x2} y2={set.grad.y2} gradientUnits="userSpaceOnUse">
          {set.grad.stops.map(([offset, color], i) => (
            <stop key={i} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      {set.glyphs.map((g, i) => (
        <g key={i} data-glyph={i}>
          {g.d.map((d, li) => (
            <path key={li} d={d} fill={set.layers[li] === "grad" ? `url(#${gid})` : set.layers[li]} />
          ))}
        </g>
      ))}
    </svg>
  );
}

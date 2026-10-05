/* eslint-disable @next/next/no-img-element -- vector artwork: no optimisation needed and sizes are fractional */
import type { ImgHTMLAttributes } from "react";

/** Plain <img> for SVG artwork drawn at exact (often fractional) design sizes. */
export function Svg({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} decoding="async" {...props} />;
}

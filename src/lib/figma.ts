type Point = { x: number; y: number };
type Stop = [color: string, position: number];

/**
 * Converts a Figma linear gradient (handles in the node's normalised box) to a
 * CSS `linear-gradient()` for an element of the given size.
 */
export function figmaLinearGradient(
  [start, end]: [Point, Point, Point?],
  stops: Stop[],
  width: number,
  height: number,
): string {
  const sx = start.x * width;
  const sy = start.y * height;
  const dx = end.x * width - sx;
  const dy = end.y * height - sy;
  const len = Math.hypot(dx, dy);
  // CSS angle: 0deg points up, clockwise.
  const angle = Math.atan2(dx, -dy);
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const cssLen = Math.abs(width * ux) + Math.abs(height * uy);
  const cx = width / 2;
  const cy = height / 2;
  const offset = (cx - sx) * ux + (cy - sy) * uy;
  const parts = stops.map(([color, p]) => {
    const t = (p * len - offset) / cssLen + 0.5;
    return `${color} ${(t * 100).toFixed(2)}%`;
  });
  return `linear-gradient(${((angle * 180) / Math.PI).toFixed(2)}deg, ${parts.join(", ")})`;
}

/** Gradient used by the oversized grey headings (#EBEBEB → #A1A1A1). */
export const sheenStops: Stop[] = [
  ["#ebebeb", 0],
  ["#aeaeae", 0.55],
  ["#a1a1a1", 1],
];

// A link as a curved path. ArcLayer cannot dash, so links are PathLayer paths with
// PathStyleExtension; the curve is a quadratic bézier in lon/lat, bowed to the left of travel so
// a link and its reverse do not overlap.

export type LonLat = [number, number];

/**
 * PathStyleExtension starts the dash pattern again on each segment, so the segments must stay
 * longer than a dash at the default zoom, or a dashed link draws solid.
 */
export const ARC_POINTS = 16;

/** How far the curve bows, as a share of the distance between the ends. */
const BOW = 0.2;

/** Two ends closer than this (in degrees) are one place; the link draws as a small loop. */
const SAME_PLACE = 0.05;
const LOOP_RADIUS = 0.6;

function loop([lon, lat]: LonLat, points: number): LonLat[] {
  const path: LonLat[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / (points - 1)) * 2 * Math.PI;
    // A teardrop that starts and ends at the place and rises north of it.
    path.push([
      lon + LOOP_RADIUS * 0.5 * Math.sin(angle),
      lat + LOOP_RADIUS * (1 - Math.cos(angle)) * 0.5,
    ]);
  }
  return path;
}

export function arcPath(from: LonLat, to: LonLat, points = ARC_POINTS): LonLat[] {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance < SAME_PLACE) return loop(from, points);

  // Control point: the midpoint pushed out along the left-hand normal.
  const cx = (x0 + x1) / 2 - dy * BOW;
  const cy = (y0 + y1) / 2 + dx * BOW;

  const path: LonLat[] = [];
  for (let i = 0; i < points; i++) {
    const s = i / (points - 1);
    const a = (1 - s) * (1 - s);
    const b = 2 * (1 - s) * s;
    const c = s * s;
    path.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]);
  }
  return path;
}

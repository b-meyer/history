// Keeps the view on the basemap: zooming out stops once the whole map fits, and panning cannot
// move it off the window or into the empty ocean the basemap leaves below 60°S. Web Mercator maths on a 512-pixel world tile, as deck.gl's
// MapView uses.

import type { MapViewState } from './url.ts';

/** The basemap's land runs to about 58.5°S; the north stops short of the pole. */
export const BOUNDS = { south: -58.5, north: 80 } as const;

const TILE = 512;

/** Latitude to a share of the world's height: 0 at the top (85°N), 1 at the bottom. */
function latToY(lat: number): number {
  const phi = (lat * Math.PI) / 180;
  return (Math.PI - Math.log(Math.tan(Math.PI / 4 + phi / 2))) / (2 * Math.PI);
}

function yToLat(y: number): number {
  const merc = Math.PI - y * 2 * Math.PI;
  return (Math.atan(Math.exp(merc)) * 2 - Math.PI / 2) * (180 / Math.PI);
}

/**
 * The smallest zoom: the one at which the whole bounded map fits the viewport, centred, with water
 * filling the spare width or height.
 */
export function minZoom(width: number, height: number): number {
  const span = latToY(BOUNDS.south) - latToY(BOUNDS.north);
  return Math.min(Math.log2(width / TILE), Math.log2(height / (TILE * span)));
}

function clamp(value: number, low: number, high: number): number {
  return low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));
}

/** The view moved inside the bounds, zoomed in as far as the viewport needs. */
export function clampView(view: MapViewState, width: number, height: number): MapViewState {
  if (width <= 0 || height <= 0) return view;
  const zoom = Math.max(view.zoom, minZoom(width, height));
  const world = TILE * 2 ** zoom;
  const halfWidth = width / 2 / world;
  const halfHeight = height / 2 / world;

  const x = clamp((view.longitude + 180) / 360, halfWidth, 1 - halfWidth);
  const y = clamp(
    latToY(view.latitude),
    latToY(BOUNDS.north) + halfHeight,
    latToY(BOUNDS.south) - halfHeight,
  );
  return { longitude: x * 360 - 180, latitude: yToLat(y), zoom };
}

/** clampView plus the minimum zoom, so deck.gl's controller stops zooming out at the bounds. */
export function boundedView(
  view: MapViewState,
  width: number,
  height: number,
): MapViewState & { minZoom: number } {
  const { longitude, latitude, zoom } = clampView(view, width, height);
  return { longitude, latitude, zoom, minZoom: width > 0 ? minZoom(width, height) : 0 };
}

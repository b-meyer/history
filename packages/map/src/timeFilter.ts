// The time window for DataFilterExtension with filterSize 2. Each item's filter value is its
// [start, end] in astronomical years; an item shows while it has started by t and ended no more
// than `window` years before t. GPU uniforms are 32-bit floats, so a large finite bound stands in
// for infinity.

export const OPEN = 1e6;

export const WINDOW_MIN = 50;
export const WINDOW_MAX = 500;
export const DEFAULT_WINDOW = 150;

type Range = [number, number];

/** Shown: start ≤ t and end ≥ t − window. */
export function filterRange(t: number, window: number): [Range, Range] {
  return [
    [-OPEN, t],
    [t - window, OPEN],
  ];
}

/**
 * Full opacity only for items that started at least `fadeIn` years ago and have not yet ended;
 * the rest fade in as they begin and fade out across the window after they end, so trails stay.
 */
export function filterSoftRange(t: number, window: number): [Range, Range] {
  const fadeIn = Math.min(5, window / 10);
  return [
    [-OPEN, t - fadeIn],
    [t, OPEN],
  ];
}

/** An item's filter value: its start and end years. */
export function filterValue(item: { start: number; end: number }): [number, number] {
  return [item.start, item.end];
}

/** True when an item is inside the window at t; the CPU's copy of the GPU test. */
export function isVisible(
  item: { start: number; end: number },
  t: number,
  window: number,
): boolean {
  return item.start <= t && item.end >= t - window;
}

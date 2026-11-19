import { describe, expect, it } from 'vite-plus/test';
import { filterRange, filterSoftRange, filterValue, isVisible, OPEN } from './timeFilter.ts';

describe('filterRange', () => {
  it('keeps what has started by t and ended within the window', () => {
    expect(filterRange(265, 150)).toEqual([
      [-OPEN, 265],
      [115, OPEN],
    ]);
  });

  it('agrees with the CPU check', () => {
    const plotinus = { start: 244, end: 270 };
    expect(isVisible(plotinus, 240, 150)).toBe(false);
    expect(isVisible(plotinus, 265, 150)).toBe(true);
    expect(isVisible(plotinus, 420, 150)).toBe(true);
    expect(isVisible(plotinus, 421, 150)).toBe(false);
    expect(filterValue(plotinus)).toEqual([244, 270]);
  });
});

describe('filterSoftRange', () => {
  it('sits inside the hard range, so items fade rather than pop', () => {
    const [[hardStartLow, hardStartHigh], [hardEndLow]] = filterRange(265, 150);
    const [[softStartLow, softStartHigh], [softEndLow]] = filterSoftRange(265, 150);
    expect(softStartLow).toBe(hardStartLow);
    expect(softStartHigh).toBeLessThan(hardStartHigh);
    expect(softEndLow).toBeGreaterThan(hardEndLow);
    expect(softEndLow).toBe(265);
  });

  it('fades in over five years, or a tenth of a short window', () => {
    expect(filterSoftRange(0, 150)[0][1]).toBe(-5);
    expect(filterSoftRange(0, 30)[0][1]).toBe(-3);
  });
});

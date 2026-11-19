import { describe, expect, it } from 'vite-plus/test';
import { ARC_POINTS, arcPath } from './arc.ts';

describe('arcPath', () => {
  it('runs from one end to the other in ARC_POINTS points', () => {
    const path = arcPath([17.13, 39.08], [12.48, 41.89]);
    expect(path).toHaveLength(ARC_POINTS);
    expect(path[0]).toEqual([17.13, 39.08]);
    expect(path.at(-1)?.[0]).toBeCloseTo(12.48);
    expect(path.at(-1)?.[1]).toBeCloseTo(41.89);
  });

  it('bows away from the straight line', () => {
    const path = arcPath([0, 0], [10, 0]);
    const middle = path[Math.floor(ARC_POINTS / 2)];
    expect(middle?.[1]).toBeGreaterThan(0.5);
  });

  it('bows the reverse link to the other side', () => {
    const there = arcPath([0, 0], [10, 0])[8]?.[1] ?? 0;
    const back = arcPath([10, 0], [0, 0])[8]?.[1] ?? 0;
    expect(Math.sign(there)).toBe(-Math.sign(back));
  });

  it('draws a loop when both ends are one place', () => {
    const path = arcPath([12.48, 41.89], [12.48, 41.89]);
    expect(path).toHaveLength(ARC_POINTS);
    expect(path[0]?.[0]).toBeCloseTo(12.48);
    expect(path[0]?.[1]).toBeCloseTo(41.89);
    expect(Math.max(...path.map(([, lat]) => lat))).toBeGreaterThan(42);
  });
});

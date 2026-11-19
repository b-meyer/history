import { describe, expect, it } from 'vite-plus/test';
import { BOUNDS, clampView, minZoom } from './bounds.ts';
import { DEFAULT_VIEW } from './url.ts';

describe('minZoom', () => {
  it('fits the whole bounded map inside the window, whichever side is tighter', () => {
    const span = 0.5866; // 58.5°S to 80°N as a share of the Mercator world's height
    for (const [width, height] of [
      [1920, 950],
      [1400, 900],
      [400, 900],
    ] as const) {
      const world = 512 * 2 ** minZoom(width, height);
      expect(world).toBeLessThanOrEqual(width + 0.5);
      expect(world * span).toBeLessThanOrEqual(height + 0.5);
    }
  });
});

describe('clampView', () => {
  it('leaves the default Mediterranean view alone', () => {
    const view = clampView(DEFAULT_VIEW, 1400, 835);
    expect(view.zoom).toBe(DEFAULT_VIEW.zoom);
    expect(view.longitude).toBeCloseTo(DEFAULT_VIEW.longitude);
    expect(view.latitude).toBeCloseTo(DEFAULT_VIEW.latitude);
  });

  it('stops zooming out once the whole map fits', () => {
    const view = clampView({ longitude: 20, latitude: 10, zoom: 0 }, 1400, 835);
    expect(view.zoom).toBeCloseTo(minZoom(1400, 835));
  });

  it('keeps the bottom edge above the southern bound once zoomed in', () => {
    const view = clampView({ longitude: 20, latitude: -80, zoom: 3 }, 1400, 835);
    expect(view.latitude).toBeGreaterThan(BOUNDS.south);
    // Panning further south changes nothing.
    expect(clampView({ ...view, latitude: view.latitude - 5 }, 1400, 835).latitude).toBeCloseTo(
      view.latitude,
    );
  });

  it('centres the map at full zoom-out', () => {
    const view = clampView({ longitude: 100, latitude: -40, zoom: 0 }, 1920, 950);
    expect(view.longitude).toBeCloseTo(0);
    expect(clampView({ ...view, latitude: view.latitude + 20 }, 1920, 950).latitude).toBeCloseTo(
      view.latitude,
    );
  });

  it('keeps the sides inside the world', () => {
    const view = clampView({ longitude: 179, latitude: 30, zoom: 3 }, 1400, 835);
    expect(view.longitude).toBeLessThan(179);
  });
});

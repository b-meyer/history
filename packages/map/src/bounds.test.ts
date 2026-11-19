import { describe, expect, it } from 'vite-plus/test';
import { BOUNDS, clampView, minZoom } from './bounds.ts';
import { DEFAULT_VIEW } from './url.ts';

describe('minZoom', () => {
  it('fits a wide window to the world width and a tall one to the latitude span', () => {
    expect(minZoom(1024, 300)).toBeCloseTo(1);
    expect(minZoom(400, 2000)).toBeGreaterThan(Math.log2(400 / 512));
  });
});

describe('clampView', () => {
  it('leaves the default Mediterranean view alone', () => {
    const view = clampView(DEFAULT_VIEW, 1400, 835);
    expect(view.zoom).toBe(DEFAULT_VIEW.zoom);
    expect(view.longitude).toBeCloseTo(DEFAULT_VIEW.longitude);
    expect(view.latitude).toBeCloseTo(DEFAULT_VIEW.latitude);
  });

  it('stops zooming out once the bounds fill the window', () => {
    const view = clampView({ longitude: 20, latitude: 10, zoom: 0 }, 1400, 835);
    expect(view.zoom).toBeCloseTo(minZoom(1400, 835));
  });

  it('keeps the bottom edge above the southern bound', () => {
    const view = clampView({ longitude: 20, latitude: -80, zoom: 3 }, 1400, 835);
    expect(view.latitude).toBeGreaterThan(BOUNDS.south);
    // Panning further south changes nothing.
    expect(clampView({ ...view, latitude: view.latitude - 5 }, 1400, 835).latitude).toBeCloseTo(
      view.latitude,
    );
  });

  it('keeps the sides inside the world', () => {
    const view = clampView({ longitude: 179, latitude: 30, zoom: 3 }, 1400, 835);
    expect(view.longitude).toBeLessThan(179);
  });
});

import { describe, expect, it } from 'vite-plus/test';
import {
  DEFAULT_LAYERS,
  DEFAULT_VIEW,
  DEFAULT_YEAR,
  formatMapUrl,
  formatYearParam,
  parseMapUrl,
  parseYearParam,
} from './url.ts';

describe('year params', () => {
  it('reads and writes years with their era, astronomically', () => {
    expect(parseYearParam('570bce')).toBe(-569);
    expect(parseYearParam('1bce')).toBe(0);
    expect(parseYearParam('263ce')).toBe(263);
    expect(parseYearParam('263CE')).toBe(263);
    expect(formatYearParam(-569)).toBe('570bce');
    expect(formatYearParam(0)).toBe('1bce');
    expect(formatYearParam(263)).toBe('263ce');
  });

  it('rejects other text and clamps to the slider range', () => {
    expect(parseYearParam('263')).toBeNull();
    expect(parseYearParam('0ce')).toBeNull();
    expect(parseYearParam('-5bce')).toBeNull();
    expect(parseYearParam('5000bce')).toBe(-1000);
    expect(parseYearParam('2100ce')).toBe(2000);
  });
});

describe('parseMapUrl', () => {
  it('falls back to the defaults', () => {
    expect(parseMapUrl('')).toEqual({
      t: DEFAULT_YEAR,
      focus: null,
      layers: [...DEFAULT_LAYERS],
      view: DEFAULT_VIEW,
    });
    expect(DEFAULT_LAYERS).not.toContain('events');
  });

  it('reads time, focus, layers and view', () => {
    expect(
      parseMapUrl('?t=500bce&focus=pythagoras&layers=people,links,bogus&v=12.5,41.9,5'),
    ).toEqual({
      t: -499,
      focus: 'pythagoras',
      layers: ['people', 'links'],
      view: { longitude: 12.5, latitude: 41.9, zoom: 5 },
    });
  });

  it('ignores a malformed focus or view', () => {
    const state = parseMapUrl('?focus=<script>&v=1,2');
    expect(state.focus).toBeNull();
    expect(state.view).toEqual(DEFAULT_VIEW);
  });
});

describe('formatMapUrl', () => {
  it('leaves out default layers and view', () => {
    expect(formatMapUrl(parseMapUrl(''))).toBe('?t=600bce');
  });

  it('round-trips a full state', () => {
    const search = '?t=265ce&focus=porphyry&layers=people,links&v=12.48,41.89,5.0';
    expect(formatMapUrl(parseMapUrl(search))).toBe(search);
  });
});

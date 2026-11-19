// @vitest-environment jsdom
import { describe, expect, it } from 'vite-plus/test';
import {
  currentTheme,
  dashOf,
  hexToRgba,
  isHollow,
  linkColor,
  palette,
  rgbaCss,
  stayColor,
  stayRadius,
} from './style.ts';

describe('line style', () => {
  it('is solid for A, dashed for B and dotted for C', () => {
    expect(dashOf('A')).toEqual([0, 0]);
    expect(dashOf('B')).toEqual([3, 3]);
    expect(dashOf('C')).toEqual([1.5, 4]);
  });

  it('gives tradition accounts their own colour in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(linkColor('tradition', theme)).toEqual(palette(theme).tradition);
      expect(linkColor('tradition', theme)).not.toEqual(linkColor('primary', theme));
      expect(linkColor('scholarly', theme)).toEqual(palette(theme).link);
    }
  });
});

describe('markers', () => {
  it('colours by type, by the entity colour, or as tradition', () => {
    expect(stayColor({ type: 'person', basis: 'primary' }, 'light')).toEqual(
      palette('light').types.person,
    );
    expect(stayColor({ type: 'school', color: '#3b6e8f', basis: 'primary' }, 'dark')).toEqual([
      59, 110, 143, 255,
    ]);
    expect(stayColor({ type: 'person', basis: 'tradition' }, 'dark')).toEqual(
      palette('dark').tradition,
    );
  });

  it('draws contested stays hollow and sizes by notability', () => {
    expect(isHollow('C')).toBe(true);
    expect(isHollow('B')).toBe(false);
    expect(stayRadius(0)).toBe(4);
    expect(stayRadius(10)).toBe(10);
    expect(stayRadius(99)).toBe(10);
  });
});

describe('theme', () => {
  it('follows html.dark', () => {
    const root = document.createElement('html');
    expect(currentTheme(root)).toBe('light');
    root.classList.add('dark');
    expect(currentTheme(root)).toBe('dark');
  });

  it('converts colours for CSS', () => {
    expect(hexToRgba('#ff8000', 128)).toEqual([255, 128, 0, 128]);
    expect(rgbaCss([255, 128, 0, 255])).toBe('rgba(255, 128, 0, 1.00)');
  });
});

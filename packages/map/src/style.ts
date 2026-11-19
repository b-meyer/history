// How the map draws each item: colour by entity type, line dash by confidence, its own colour for
// a tradition's account of itself, and hollow markers for contested stays. Two palettes, picked
// by `html.dark`, keep the marks readable on either basemap.

import type { Basis, Confidence, EntityType } from 'graph';

export type Rgba = [number, number, number, number];
export type Theme = 'light' | 'dark';

export type Palette = {
  background: Rgba;
  land: Rgba;
  coast: Rgba;
  water: Rgba;
  label: Rgba;
  labelOutline: Rgba;
  link: Rgba;
  tradition: Rgba;
  focus: Rgba;
  /** dev:leads only: unaudited leads. */
  lead: Rgba;
  types: Record<EntityType, Rgba>;
};

const LIGHT: Palette = {
  background: [214, 226, 236, 255],
  land: [244, 240, 230, 255],
  coast: [170, 160, 140, 255],
  water: [190, 210, 228, 255],
  label: [40, 40, 40, 255],
  labelOutline: [255, 255, 255, 220],
  link: [70, 80, 100, 220],
  tradition: [176, 92, 20, 230],
  focus: [200, 30, 60, 255],
  lead: [190, 0, 150, 190],
  types: {
    tradition: [120, 70, 150, 255],
    school: [40, 120, 110, 255],
    person: [45, 95, 170, 255],
    work: [150, 110, 30, 255],
    institution: [110, 70, 50, 255],
    place: [90, 90, 90, 255],
    event: [170, 50, 50, 255],
  },
};

const DARK: Palette = {
  background: [18, 24, 32, 255],
  land: [44, 48, 52, 255],
  coast: [90, 96, 100, 255],
  water: [30, 42, 56, 255],
  label: [230, 230, 230, 255],
  labelOutline: [0, 0, 0, 200],
  link: [190, 200, 215, 220],
  tradition: [240, 160, 80, 230],
  focus: [255, 110, 130, 255],
  lead: [255, 120, 225, 200],
  types: {
    tradition: [190, 150, 220, 255],
    school: [110, 200, 185, 255],
    person: [120, 170, 240, 255],
    work: [225, 190, 100, 255],
    institution: [200, 160, 130, 255],
    place: [170, 170, 170, 255],
    event: [240, 120, 120, 255],
  },
};

export function palette(theme: Theme): Palette {
  return theme === 'dark' ? DARK : LIGHT;
}

/** The theme qdocs set on <html>. */
export function currentTheme(root: Element = document.documentElement): Theme {
  return root.classList.contains('dark') ? 'dark' : 'light';
}

/** PathStyleExtension dash arrays: [dash, gap] in half line widths; [0, 0] is solid. */
export const DASH: Record<Confidence, [number, number]> = {
  A: [0, 0],
  B: [3, 3],
  C: [1.5, 4],
};

export function dashOf(confidence: Confidence): [number, number] {
  return DASH[confidence];
}

/** A link's colour: its own for a tradition's account, else the plain link colour. */
export function linkColor(basis: Basis, theme: Theme): Rgba {
  const colors = palette(theme);
  return basis === 'tradition' ? colors.tradition : colors.link;
}

/** A stay's colour: its own colour when the entity sets one, else its type's. */
export function stayColor(
  stay: { type: EntityType; color?: string; basis: Basis },
  theme: Theme,
): Rgba {
  if (stay.basis === 'tradition') return palette(theme).tradition;
  if (stay.color !== undefined) return hexToRgba(stay.color);
  return palette(theme).types[stay.type];
}

/** Contested stays draw as hollow rings; the rest are filled. */
export function isHollow(confidence: Confidence): boolean {
  return confidence === 'C';
}

/** Marker radius in pixels, by notability (0–10). */
export function stayRadius(notability: number): number {
  return 4 + Math.min(10, Math.max(0, notability)) * 0.6;
}

export function hexToRgba(hex: string, alpha = 255): Rgba {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}

/** An Rgba as CSS, for the legend's samples. */
export function rgbaCss([r, g, b, a]: Rgba): string {
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

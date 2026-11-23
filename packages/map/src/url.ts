// Map state in the URL: /map?t=500bce&focus=pythagoras&layers=people,links&v=20,37,3.5
// Years are astronomical inside the app (-569 is 570 BCE) and written with their era in the URL,
// by the same rule as graph's formatYear.

export const LAYERS = [
  'people',
  'works',
  'schools',
  'institutions',
  'links',
  'events',
  'contested',
  'tradition',
] as const;
export type LayerId = (typeof LAYERS)[number];

/** Every layer starts on but events (PLAN: /map layers). */
export const DEFAULT_LAYERS: readonly LayerId[] = LAYERS.filter((layer) => layer !== 'events');

export type MapViewState = { longitude: number; latitude: number; zoom: number };

export type MapUrlState = {
  /** The slider's year, astronomical. */
  t: number;
  focus: string | null;
  layers: LayerId[];
  view: MapViewState;
};

export const YEAR_MIN = -999;
export const YEAR_MAX = 2000;

/** 600 BCE, where the corridor starts. */
export const DEFAULT_YEAR = -599;

/** The eastern Mediterranean, from Italy to the Levant. */
export const DEFAULT_VIEW: MapViewState = { longitude: 22, latitude: 36, zoom: 3.6 };

export function defaultMapState(): MapUrlState {
  return { t: DEFAULT_YEAR, focus: null, layers: [...DEFAULT_LAYERS], view: { ...DEFAULT_VIEW } };
}

const YEAR = /^(?<number>\d{1,4})(?<era>bce|ce)$/u;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** "570bce" → -569, "263ce" → 263; null for anything else. */
export function parseYearParam(text: string): number | null {
  const match = YEAR.exec(text.trim().toLowerCase());
  if (match?.groups === undefined) return null;
  const value = Number(match.groups['number']);
  if (value === 0) return null;
  const year = match.groups['era'] === 'bce' ? 1 - value : value;
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, year));
}

/** -569 → "570bce", 263 → "263ce". */
export function formatYearParam(year: number): string {
  const whole = Math.round(year);
  return whole <= 0 ? `${1 - whole}bce` : `${whole}ce`;
}

function parseView(text: string): MapViewState | null {
  const parts = text.split(',').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [longitude = 0, latitude = 0, zoom = 0] = parts;
  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 85 || zoom < 0 || zoom > 20) return null;
  return { longitude, latitude, zoom };
}

function parseLayers(text: string): LayerId[] {
  const wanted = new Set(text.split(','));
  return LAYERS.filter((layer) => wanted.has(layer));
}

/** Reads map state from a query string, falling back to the default for each missing value. */
export function parseMapUrl(search: string): MapUrlState {
  const params = new URLSearchParams(search);
  const state = defaultMapState();

  const t = params.get('t');
  const year = t === null ? null : parseYearParam(t);
  if (year !== null) state.t = year;

  const focus = params.get('focus');
  if (focus !== null && ID.test(focus)) state.focus = focus;

  const layers = params.get('layers');
  if (layers !== null) state.layers = parseLayers(layers);

  const v = params.get('v');
  const view = v === null ? null : parseView(v);
  if (view !== null) state.view = view;

  return state;
}

function sameLayers(a: readonly LayerId[], b: readonly LayerId[]): boolean {
  return a.length === b.length && a.every((layer) => b.includes(layer));
}

/** The query string for a state, with `?`. Default layers and view are left out. */
export function formatMapUrl(state: MapUrlState): string {
  const params: string[] = [`t=${formatYearParam(state.t)}`];
  if (state.focus !== null) params.push(`focus=${state.focus}`);
  if (!sameLayers(state.layers, DEFAULT_LAYERS)) params.push(`layers=${state.layers.join(',')}`);
  const { longitude, latitude, zoom } = state.view;
  const view = `${longitude.toFixed(2)},${latitude.toFixed(2)},${zoom.toFixed(1)}`;
  const fallback = `${DEFAULT_VIEW.longitude.toFixed(2)},${DEFAULT_VIEW.latitude.toFixed(2)},${DEFAULT_VIEW.zoom.toFixed(1)}`;
  if (view !== fallback) params.push(`v=${view}`);
  return `?${params.join('&')}`;
}

/** dev:leads only: where the dev server serves lead map data. Never a built file. */
export const LEADS_URL = '/__leads/map.json';

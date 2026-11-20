// The deck.gl layers, rebuilt on every change. Data arrays keep their identity between builds, so
// moving the slider changes only filterRange and deck.gl skips the attribute updates.

import type { Layer } from '@deck.gl/core';
import {
  DataFilterExtension,
  PathStyleExtension,
  type DataFilterExtensionProps,
  type PathStyleExtensionProps,
} from '@deck.gl/extensions';
import { GeoJsonLayer, PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { MapLink, MapStay } from 'graph';
import type { LonLat } from './arc.ts';
import type { MapLabel } from './data.ts';
import {
  dashOf,
  isHollow,
  linkColor,
  palette,
  stayColor,
  stayRadius,
  type Rgba,
  type Theme,
} from './style.ts';
import { filterRange, filterSoftRange, filterValue } from './timeFilter.ts';

export const BASEMAP = ['ne_50m_land', 'ne_50m_lakes', 'ne_50m_rivers_lake_centerlines'] as const;
export type Basemap = Record<(typeof BASEMAP)[number], unknown>;

export type LinkPath = { link: MapLink; path: LonLat[] };

export type LayerInput = {
  theme: Theme;
  t: number;
  window: number;
  /** The entity whose stays are ringed. */
  focus: string | null;
  basemap: Basemap | null;
  stays: MapStay[];
  labels: MapLabel[];
  links: LinkPath[];
  /** dev:leads only: unaudited leads, drawn beneath the graph and never pickable. */
  leads?: { stays: MapStay[]; labels: MapLabel[]; links: LinkPath[] };
};

const timeFilter = new DataFilterExtension({ filterSize: 2 });
const dashes = new PathStyleExtension({ dash: true });

const TRANSPARENT: Rgba = [0, 0, 0, 0];

function timeProps(input: LayerInput) {
  return {
    filterRange: filterRange(input.t, input.window),
    filterSoftRange: filterSoftRange(input.t, input.window),
  };
}

function basemapLayers({ basemap, theme }: LayerInput): Layer[] {
  if (basemap === null) return [];
  const colors = palette(theme);
  return [
    new GeoJsonLayer({
      id: 'land',
      data: basemap.ne_50m_land as never,
      filled: true,
      stroked: true,
      getFillColor: colors.land,
      getLineColor: colors.coast,
      lineWidthMinPixels: 0.5,
    }),
    new GeoJsonLayer({
      id: 'lakes',
      data: basemap.ne_50m_lakes as never,
      filled: true,
      stroked: false,
      getFillColor: colors.water,
    }),
    new GeoJsonLayer({
      id: 'rivers',
      data: basemap.ne_50m_rivers_lake_centerlines as never,
      filled: false,
      stroked: true,
      getLineColor: colors.water,
      lineWidthMinPixels: 1,
    }),
  ];
}

function linkLayer(input: LayerInput): Layer {
  const { theme } = input;
  return new PathLayer<
    LinkPath,
    DataFilterExtensionProps<LinkPath> & PathStyleExtensionProps<LinkPath>
  >({
    id: 'links',
    data: input.links,
    pickable: true,
    getPath: (item) => item.path,
    getColor: (item) => linkColor(item.link.basis, theme),
    getWidth: 2.5,
    widthUnits: 'pixels',
    capRounded: true,
    getDashArray: (item) => dashOf(item.link.confidence),
    getFilterValue: (item) => filterValue(item.link),
    ...timeProps(input),
    extensions: [timeFilter, dashes],
    updateTriggers: { getColor: theme },
  });
}

function stayLayer(input: LayerInput): Layer {
  const { theme, focus } = input;
  const colors = palette(theme);
  return new ScatterplotLayer<MapStay, DataFilterExtensionProps<MapStay>>({
    id: 'stays',
    data: input.stays,
    pickable: true,
    stroked: true,
    filled: true,
    radiusUnits: 'pixels',
    lineWidthUnits: 'pixels',
    getPosition: (stay) => stay.coords,
    getRadius: (stay) => stayRadius(stay.notability),
    getFillColor: (stay) => (isHollow(stay.confidence) ? TRANSPARENT : stayColor(stay, theme)),
    getLineColor: (stay) => {
      if (stay.entity === focus) return colors.focus;
      return isHollow(stay.confidence) ? stayColor(stay, theme) : colors.labelOutline;
    },
    getLineWidth: (stay) => (stay.entity === focus ? 3 : isHollow(stay.confidence) ? 2 : 1),
    getFilterValue: filterValue,
    ...timeProps(input),
    extensions: [timeFilter],
    updateTriggers: {
      getFillColor: theme,
      getLineColor: [theme, focus],
      getLineWidth: focus,
    },
  });
}

function labelLayer(input: LayerInput): Layer {
  const colors = palette(input.theme);
  return new TextLayer<MapLabel, DataFilterExtensionProps<MapLabel>>({
    id: 'labels',
    data: input.labels,
    getText: (label) => label.name,
    getPosition: (label) => label.coords,
    getPixelOffset: (label) => [0, -(stayRadius(label.notability) + 9 + label.row * 15)],
    getSize: 13,
    sizeUnits: 'pixels',
    fontWeight: 600,
    characterSet: 'auto',
    getColor: colors.label,
    outlineWidth: 3,
    outlineColor: colors.labelOutline,
    fontSettings: { sdf: true },
    getFilterValue: filterValue,
    ...timeProps(input),
    extensions: [timeFilter],
  });
}

type Leads = NonNullable<LayerInput['leads']>;

function leadLinkLayer(input: LayerInput, leads: Leads, color: Rgba): Layer {
  return new PathLayer<
    LinkPath,
    DataFilterExtensionProps<LinkPath> & PathStyleExtensionProps<LinkPath>
  >({
    id: 'lead-links',
    data: leads.links,
    getPath: (item) => item.path,
    getColor: color,
    getWidth: 1.5,
    widthUnits: 'pixels',
    getDashArray: [1, 3],
    getFilterValue: (item) => filterValue(item.link),
    ...timeProps(input),
    extensions: [timeFilter, dashes],
    updateTriggers: { getColor: input.theme },
  });
}

function leadStayLayer(input: LayerInput, leads: Leads, color: Rgba): Layer {
  return new ScatterplotLayer<MapStay, DataFilterExtensionProps<MapStay>>({
    id: 'lead-stays',
    data: leads.stays,
    stroked: true,
    filled: false,
    radiusUnits: 'pixels',
    lineWidthUnits: 'pixels',
    getPosition: (stay) => stay.coords,
    getRadius: (stay) => stayRadius(stay.notability),
    getLineColor: color,
    getLineWidth: 1.5,
    getFilterValue: filterValue,
    ...timeProps(input),
    extensions: [timeFilter],
    updateTriggers: { getLineColor: input.theme },
  });
}

function leadLabelLayer(input: LayerInput, leads: Leads, color: Rgba): Layer {
  return new TextLayer<MapLabel, DataFilterExtensionProps<MapLabel>>({
    id: 'lead-labels',
    data: leads.labels,
    getText: (label) => label.name,
    getPosition: (label) => label.coords,
    getPixelOffset: (label) => [0, -(stayRadius(label.notability) + 8 + label.row * 13)],
    getSize: 11,
    sizeUnits: 'pixels',
    characterSet: 'auto',
    getColor: color,
    outlineWidth: 2,
    outlineColor: palette(input.theme).labelOutline,
    fontSettings: { sdf: true },
    getFilterValue: filterValue,
    ...timeProps(input),
    extensions: [timeFilter],
    updateTriggers: { getColor: input.theme },
  });
}

/** A dotted line, a hollow ring and a small label, all in the lead colour. */
function leadLayers(input: LayerInput): Layer[] {
  if (input.leads === undefined) return [];
  const color = palette(input.theme).lead;
  return [
    leadLinkLayer(input, input.leads, color),
    leadStayLayer(input, input.leads, color),
    leadLabelLayer(input, input.leads, color),
  ];
}

export function buildLayers(input: LayerInput): Layer[] {
  return [
    ...basemapLayers(input),
    ...leadLayers(input),
    linkLayer(input),
    stayLayer(input),
    labelLayer(input),
  ];
}

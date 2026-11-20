// What each layer toggle keeps, and which stay a focus lands on. Pure, so the toggles run on the
// CPU only when they change; time is filtered on the GPU.

import type { EntityType, MapEntity, MapLink, MapStay } from 'graph';
import type { LayerId } from './url.ts';

export type Selection =
  | { kind: 'stay'; stay: MapStay }
  | { kind: 'link'; link: MapLink }
  | { kind: 'entity'; entity: MapEntity };

/** The layer toggle a stay's entity type belongs to; places have none. */
const TYPE_LAYER: Record<EntityType, LayerId | null> = {
  person: 'people',
  work: 'works',
  school: 'schools',
  tradition: 'schools',
  institution: 'institutions',
  event: 'events',
  place: null,
};

function passesClaimToggles(
  item: { confidence: string; basis: string },
  layers: ReadonlySet<LayerId>,
): boolean {
  if (item.confidence === 'C' && !layers.has('contested')) return false;
  if (item.basis === 'tradition' && !layers.has('tradition')) return false;
  return true;
}

export function visibleStays(stays: readonly MapStay[], layers: readonly LayerId[]): MapStay[] {
  const on = new Set(layers);
  return stays.filter((stay) => {
    const layer = TYPE_LAYER[stay.type];
    return layer !== null && on.has(layer) && passesClaimToggles(stay, on);
  });
}

export function visibleLinks(links: readonly MapLink[], layers: readonly LayerId[]): MapLink[] {
  const on = new Set(layers);
  if (!on.has('links')) return [];
  return links.filter((link) => passesClaimToggles(link, on));
}

/** The entity's stay nearest year t: one that covers t first, then the nearest by year. */
export function stayAt(stays: readonly MapStay[], entity: string, t: number): MapStay | undefined {
  let best: MapStay | undefined;
  let bestGap = Infinity;
  for (const stay of stays) {
    if (stay.entity !== entity) continue;
    const distance = t < stay.start ? stay.start - t : t > stay.end ? t - stay.end : 0;
    if (distance < bestGap) {
      best = stay;
      bestGap = distance;
    }
  }
  return best;
}

export type MapLabel = {
  entity: string;
  name: string;
  coords: [number, number];
  start: number;
  end: number;
  notability: number;
  /** Stacks labels that share a place: 0 sits just above the dot, 1 above that, and so on. */
  row: number;
};

/**
 * One label per entity and place, spanning every stay it has there. Labels at one place get
 * rows in order of their start, so two schools at one centre don't print over each other.
 */
export function labelData(stays: readonly MapStay[]): MapLabel[] {
  const labels = new Map<string, MapLabel>();
  for (const stay of stays) {
    const key = `${stay.entity}|${stay.place}`;
    const label = labels.get(key);
    if (label === undefined) {
      labels.set(key, {
        entity: stay.entity,
        name: stay.name,
        coords: stay.coords,
        start: stay.start,
        end: stay.end,
        notability: stay.notability,
        row: 0,
      });
    } else {
      label.start = Math.min(label.start, stay.start);
      label.end = Math.max(label.end, stay.end);
    }
  }
  const rows = new Map<string, number>();
  const result = [...labels.values()];
  for (const label of result.toSorted((a, b) => a.start - b.start)) {
    const place = label.coords.join(',');
    label.row = rows.get(place) ?? 0;
    rows.set(place, label.row + 1);
  }
  return result;
}

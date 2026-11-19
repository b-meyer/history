import { parseEdtf } from '../dates.ts';
import type { Graph } from '../load.ts';
import type { EntityType } from '../schema/common.ts';
import type { Claim } from '../schema/entity.ts';
import type { Basis, Confidence } from '../schema/vocab.ts';
import { spanOf } from './records.ts';

export type MapEntity = {
  id: string;
  type: EntityType;
  name: string;
  notability: number;
  start: number | null;
  end: number | null;
  color?: string;
};

export type MapClaim = {
  id: string;
  subject: string;
  predicate: string;
  object?: string;
  /** The place the claim happens at: its `where`, or its object when that is a place. */
  place?: string;
  start: number | null;
  end: number | null;
  approximate: boolean;
  confidence: Confidence;
  basis: Basis;
};

/** An entity at a place for a span of years, from one claim. The map draws it as a point. */
export type MapStay = {
  entity: string;
  type: EntityType;
  name: string;
  notability: number;
  color?: string;
  /** The claim that puts the entity there. */
  claim: string;
  place: string;
  coords: [number, number];
  start: number;
  end: number;
  approximate: boolean;
  confidence: Confidence;
  basis: Basis;
};

/** A claim between two entities, drawn from the object's place to the subject's. */
export type MapLink = {
  claim: string;
  predicate: string;
  label: string;
  subject: string;
  object: string;
  from: [number, number];
  to: [number, number];
  start: number;
  end: number;
  confidence: Confidence;
  basis: Basis;
};

/** public/data/map.json: every audited item with its year bounds, place and confidence. */
export type MapData = {
  places: Record<string, { name: string; coords: [number, number] }>;
  entities: MapEntity[];
  claims: MapClaim[];
  /** Draw-ready points: one per claim that puts an entity at a place with coords. */
  stays: MapStay[];
  /** Draw-ready lines: one per claim between two entities that both have a stay. */
  links: MapLink[];
};

type Range = { start: number; end: number };
type Bounds = { start: number | null; end: number | null };

/** Fills a missing end from the other one; null when neither is known. */
function closed({ start, end }: Bounds): Range | null {
  if (start === null && end === null) return null;
  return { start: start ?? end ?? 0, end: end ?? start ?? 0 };
}

/** Years between two ranges; 0 when they overlap. */
function gap(a: Range, b: Range): number {
  if (a.end < b.start) return b.start - a.end;
  if (b.end < a.start) return a.start - b.end;
  return 0;
}

/** The stay nearest a span of years: an overlapping one first, then the nearest by year. */
function nearest(stays: MapStay[], range: Range): MapStay | undefined {
  let best: MapStay | undefined;
  let bestGap = Infinity;
  for (const stay of stays) {
    const distance = gap(stay, range);
    if (distance < bestGap) {
      best = stay;
      bestGap = distance;
    }
  }
  return best;
}

function placeOf(graph: Graph, claim: Claim): string | undefined {
  const objectIsPlace =
    claim.object !== undefined && graph.entities.get(claim.object)?.type === 'place';
  return claim.where ?? (objectIsPlace ? claim.object : undefined);
}

export function buildMapData(graph: Graph): MapData {
  const places: MapData['places'] = {};
  const entities: MapEntity[] = [];
  const claims: MapClaim[] = [];
  const spans = new Map<string, Bounds>();

  for (const [id, entity] of graph.entities) {
    if (entity.type === 'place' && entity.coords !== undefined)
      places[id] = { name: entity.names.en, coords: entity.coords };

    const span = spanOf(
      entity.claims.flatMap((claim) => (claim.when === undefined ? [] : [claim.when])),
    );
    spans.set(id, span);
    entities.push({
      id,
      type: entity.type,
      name: entity.names.en,
      notability: entity.notability ?? 0,
      start: span.start,
      end: span.end,
      ...(entity.color === undefined ? {} : { color: entity.color }),
    });

    for (const claim of entity.claims) {
      const bounds = claim.when === undefined ? null : parseEdtf(claim.when);
      const place = placeOf(graph, claim);
      claims.push({
        id: claim.id,
        subject: id,
        predicate: claim.predicate,
        ...(claim.object === undefined ? {} : { object: claim.object }),
        ...(place === undefined ? {} : { place }),
        start: bounds?.start ?? null,
        end: bounds?.end ?? null,
        approximate: bounds?.approximate ?? false,
        confidence: claim.confidence,
        basis: claim.basis,
      });
    }
  }

  const stays = buildStays(graph, places, spans);
  const links = buildLinks(graph, places, spans, stays);
  return { places, entities, claims, stays, links };
}

function buildStays(
  graph: Graph,
  places: MapData['places'],
  spans: Map<string, Bounds>,
): MapStay[] {
  const stays: MapStay[] = [];
  for (const [id, entity] of graph.entities) {
    const entitySpan = closed(spans.get(id) ?? { start: null, end: null });
    for (const claim of entity.claims) {
      const place = placeOf(graph, claim);
      const coords = place === undefined ? undefined : places[place]?.coords;
      if (place === undefined || coords === undefined) continue;
      const bounds = claim.when === undefined ? null : parseEdtf(claim.when);
      const range = (bounds === null ? null : closed(bounds)) ?? entitySpan;
      if (range === null) continue;
      stays.push({
        entity: id,
        type: entity.type,
        name: entity.names.en,
        notability: entity.notability ?? 0,
        ...(entity.color === undefined ? {} : { color: entity.color }),
        claim: claim.id,
        place,
        coords,
        start: range.start,
        end: range.end,
        approximate: bounds?.approximate ?? bounds === null,
        confidence: claim.confidence,
        basis: claim.basis,
      });
    }
  }
  return stays;
}

function buildLinks(
  graph: Graph,
  places: MapData['places'],
  spans: Map<string, Bounds>,
  stays: MapStay[],
): MapLink[] {
  const staysOf = new Map<string, MapStay[]>();
  for (const stay of stays) {
    const list = staysOf.get(stay.entity) ?? [];
    list.push(stay);
    staysOf.set(stay.entity, list);
  }

  const links: MapLink[] = [];
  for (const [id, entity] of graph.entities) {
    for (const claim of entity.claims) {
      const objectId = claim.object;
      if (objectId === undefined) continue;
      const object = graph.entities.get(objectId);
      if (object === undefined || object.type === 'place') continue;

      const bounds = claim.when === undefined ? null : parseEdtf(claim.when);
      const range = (bounds === null ? null : closed(bounds)) ?? laterSpan(spans, id, objectId);
      if (range === null) continue;

      const from = nearest(staysOf.get(objectId) ?? [], range)?.coords;
      const where = claim.where === undefined ? undefined : places[claim.where]?.coords;
      const to = where ?? nearest(staysOf.get(id) ?? [], range)?.coords;
      if (from === undefined || to === undefined) continue;

      links.push({
        claim: claim.id,
        predicate: claim.predicate,
        label: graph.vocab.predicates[claim.predicate]?.label ?? claim.predicate,
        subject: id,
        object: objectId,
        from,
        to,
        start: range.start,
        end: range.end,
        confidence: claim.confidence,
        basis: claim.basis,
      });
    }
  }
  return links;
}

/** The span of whichever entity becomes active later, so an undated link draws from then. */
function laterSpan(spans: Map<string, Bounds>, a: string, b: string): Range | null {
  const first = closed(spans.get(a) ?? { start: null, end: null });
  const second = closed(spans.get(b) ?? { start: null, end: null });
  if (first === null) return second;
  if (second === null) return first;
  return second.start > first.start ? second : first;
}

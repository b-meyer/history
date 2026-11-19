import { parseEdtf } from '../dates.ts';
import type { Graph } from '../load.ts';
import type { EntityType } from '../schema/common.ts';
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

/** public/data/map.json: every reviewed item with its year bounds, place and confidence. */
export type MapData = {
  places: Record<string, { name: string; coords: [number, number] }>;
  entities: MapEntity[];
  claims: MapClaim[];
};

export function buildMapData(graph: Graph): MapData {
  const places: MapData['places'] = {};
  const entities: MapEntity[] = [];
  const claims: MapClaim[] = [];

  for (const [id, entity] of graph.entities) {
    if (entity.type === 'place' && entity.coords !== undefined)
      places[id] = { name: entity.names.en, coords: entity.coords };

    const span = spanOf(
      entity.claims.flatMap((claim) => (claim.when === undefined ? [] : [claim.when])),
    );
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
      const objectIsPlace =
        claim.object !== undefined && graph.entities.get(claim.object)?.type === 'place';
      const place = claim.where ?? (objectIsPlace ? claim.object : undefined);
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

  return { places, entities, claims };
}

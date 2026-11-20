import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { buildMapData, type MapData } from './build/mapData.ts';
import { isEdtf, parseEdtf } from './dates.ts';
import type { Graph } from './load.ts';
import { ENTITY_TYPES, type EntityType } from './schema/common.ts';
import type { Claim, Entity } from './schema/entity.ts';
import type { Vocab } from './schema/vocab.ts';

// Leads for `dev:leads`: the library's unaudited Wikidata imports (LIBRARY_DIR/leads/wikidata/),
// turned into map data by the same transform as the graph, with every item flagged `lead`. Only
// the dev server reads this; nothing here is written to public/data, and the site build refuses
// lead data there (see leadGuard.ts).

type Ref = { qid: string; label?: string; coords?: [number, number] };

type Lead = {
  qid: string;
  label: string;
  type: EntityType;
  sitelinks: number;
  coords?: [number, number];
  dates: Record<string, string[]>;
  places: Record<string, Ref[]>;
  links: Record<string, Ref[]>;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function lonLat(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const [lon, lat] = value.map(Number);
  return lon !== undefined && lat !== undefined && Number.isFinite(lon) && Number.isFinite(lat)
    ? [lon, lat]
    : undefined;
}

function refs(value: unknown): Record<string, Ref[]> {
  const out: Record<string, Ref[]> = {};
  for (const [field, items] of Object.entries(record(value))) {
    if (!Array.isArray(items)) continue;
    out[field] = items.flatMap((item) => {
      const { qid, label, coords } = record(item);
      if (typeof qid !== 'string') return [];
      const point = lonLat(coords);
      return [
        {
          qid,
          ...(typeof label === 'string' ? { label } : {}),
          ...(point === undefined ? {} : { coords: point }),
        },
      ];
    });
  }
  return out;
}

function dates(value: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [field, items] of Object.entries(record(value))) {
    if (Array.isArray(items)) out[field] = items.filter((d): d is string => isEdtf(String(d)));
  }
  return out;
}

/** One lead file's text, or null when it is not a lead the map can type. */
export function parseLead(text: string): Lead | null {
  const data = record(parse(text, { schema: 'failsafe' }));
  const { qid, label, type, sitelinks, coords } = data;
  if (typeof qid !== 'string' || typeof label !== 'string') return null;
  if (!(ENTITY_TYPES as readonly unknown[]).includes(type)) return null;
  const point = lonLat(coords);
  return {
    qid,
    label,
    type: type as EntityType,
    sitelinks: Number(sitelinks ?? 0) || 0,
    ...(point === undefined ? {} : { coords: point }),
    dates: dates(data['dates']),
    places: refs(data['places']),
    links: refs(data['links']),
  };
}

/** Lead IDs live apart from graph IDs: Q10261 is `wd-q10261`. */
export function leadId(qid: string): string {
  return `wd-${qid.toLowerCase()}`;
}

/** A notability hint from sitelinks: about log2, capped at 10. 278 sitelinks is 8. */
export function leadNotability(sitelinks: number): number {
  return Math.min(10, Math.round(Math.log2(Math.max(0, sitelinks) + 1)));
}

/** The earliest of a lead's dates for a field. */
function earliest(list: string[] | undefined): string | undefined {
  return list?.toSorted((a, b) => (parseEdtf(a)?.start ?? 0) - (parseEdtf(b)?.start ?? 0))[0];
}

/** Map predicate for each lead link field; buildMapData only reads labels from these. */
const LINK_PREDICATES: Record<string, string> = {
  'student-of': 'student-of',
  'influenced-by': 'influenced-by',
  religion: 'member-of',
  'part-of': 'branch-of',
  'founded-by': 'founded-by',
  follows: 'follows',
};

/** Which date and place make a stay, by lead field. */
const STAYS: [date: string, place: string | null, predicate: string][] = [
  ['born', 'born-in', 'born'],
  ['died', 'died-in', 'died'],
  ['founded', 'located-in', 'opened'],
  ['published', null, 'composed'],
];

function claim(id: string, predicate: string, extra: Partial<Claim>): Claim {
  return {
    id: `${id}.${predicate}${extra.object === undefined ? '' : `.${extra.object}`}`,
    predicate,
    confidence: 'B',
    basis: 'scholarly',
    origin: 'import',
    audits: [],
    sources: [{ key: 'wikidata', locator: 'lead', stance: 'asserts', excerpt: 'lead' }],
    ...extra,
  };
}

function stayClaims(lead: Lead, id: string, places: Map<string, Entity>): Claim[] {
  const claims: Claim[] = [];
  const self = lead.type === 'place' ? undefined : lead.places['located-in']?.[0];
  for (const [field, placeField, predicate] of STAYS) {
    const when = earliest(lead.dates[field]);
    const place = placeField === null ? self : (lead.places[placeField]?.[0] ?? self);
    const where = place?.coords === undefined ? undefined : leadId(place.qid);
    if (when === undefined && where === undefined) continue;
    if (place !== undefined && where !== undefined) addPlace(places, place);
    claims.push(
      claim(id, predicate, {
        ...(when === undefined ? {} : { when }),
        ...(where === undefined ? {} : { where }),
      }),
    );
  }
  return claims;
}

function addPlace(places: Map<string, Entity>, ref: Ref): void {
  const id = leadId(ref.qid);
  if (places.has(id) || ref.coords === undefined) return;
  places.set(id, {
    id,
    type: 'place',
    names: { en: ref.label ?? ref.qid },
    coords: ref.coords,
    claims: [],
  });
}

function linkClaims(lead: Lead, id: string): Claim[] {
  return Object.entries(lead.links).flatMap(([field, targets]) => {
    const predicate = LINK_PREDICATES[field];
    if (predicate === undefined) return [];
    return targets.map((target) => claim(id, predicate, { object: leadId(target.qid) }));
  });
}

function toEntity(lead: Lead, places: Map<string, Entity>): Entity {
  const id = leadId(lead.qid);
  return {
    id,
    type: lead.type,
    names: { en: lead.label },
    notability: leadNotability(lead.sitelinks),
    ...(lead.type === 'place' && lead.coords !== undefined ? { coords: lead.coords } : {}),
    claims: [...stayClaims(lead, id, places), ...linkClaims(lead, id)],
  };
}

/** Map data for a set of leads, every stay and link flagged `lead`. */
export function buildLeadMapData(leads: readonly Lead[], vocab: Vocab): MapData {
  const places = new Map<string, Entity>();
  const entities = new Map<string, Entity>();
  for (const lead of leads) entities.set(leadId(lead.qid), toEntity(lead, places));
  for (const [id, place] of places) if (!entities.has(id)) entities.set(id, place);
  const graph: Graph = { vocab, entities, sources: new Map(), entityFiles: new Map() };
  const map = buildMapData(graph);
  return {
    ...map,
    stays: map.stays.map((stay) => ({ ...stay, lead: true })),
    links: map.links.map((link) => ({ ...link, lead: true })),
  };
}

/** Every typed lead in LIBRARY_DIR/leads/wikidata/. */
export function readLeads(libraryDir: string): Lead[] {
  const dir = join(libraryDir, 'leads', 'wikidata');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^Q\d+\.yaml$/u.test(name))
    .flatMap((name) => {
      const lead = parseLead(readFileSync(join(dir, name), 'utf8'));
      return lead === null ? [] : [lead];
    });
}

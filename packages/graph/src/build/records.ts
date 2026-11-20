import { isPassing, latestAudit } from '../audits.ts';
import { formatEdtf, parseEdtf } from '../dates.ts';
import { claimsByEntity, type Graph, type Link } from '../load.ts';
import type { EntityType } from '../schema/common.ts';
import type { Entity } from '../schema/entity.ts';
import type { Source } from '../schema/source.ts';
import type { Basis, Confidence, ORIGIN, STANCE } from '../schema/vocab.ts';
import { shardOf } from '../shard.ts';

export type RecordRef = { id: string; type: EntityType; name: string };

export type RecordClaim = {
  id: string;
  /** The predicate as read from this record: the inverse when the claim is derived. */
  predicate: string;
  label: string;
  /** True when the claim is stored on another entity and points at this one. */
  derived: boolean;
  /** The other entity: the object for a stored claim, the subject for a derived one. */
  other?: RecordRef;
  when?: string;
  whenText?: string;
  where?: RecordRef;
  confidence: Confidence;
  basis: Basis;
  origin: (typeof ORIGIN)[number];
  /** Passing audits, and the date of the latest audit. */
  audits: { count: number; last: string };
  sources: { key: string; locator: string; stance: (typeof STANCE)[number]; excerpt: string }[];
};

export type RecordSource = {
  key: string;
  kind: 'primary' | 'secondary';
  title: string;
  authors?: string[];
  translators?: string[];
  published?: string;
  written?: string;
  writtenText?: string;
  url?: string;
  readingList?: true;
  /** The operator's note on the source, shown with it on reading lists. */
  annotation?: string;
};

export type EntityRecord = {
  id: string;
  type: EntityType;
  names: Record<string, string>;
  ids?: NonNullable<Entity['ids']>;
  coords?: [number, number];
  family?: string;
  language?: string;
  status?: 'extant' | 'fragmentary' | 'lost';
  kind?: string;
  color?: string;
  /** Earliest and latest year across the entity's own dated claims. */
  span: { start: number | null; end: number | null };
  claims: RecordClaim[];
  /** Every source the claims cite, by key, with when each was written. */
  sources: Record<string, RecordSource>;
};

/** Earliest start and latest end across a list of EDTF strings. */
export function spanOf(whens: string[]): { start: number | null; end: number | null } {
  let start: number | null = null;
  let end: number | null = null;
  for (const when of whens) {
    const bounds = parseEdtf(when);
    if (bounds === null) continue;
    if (bounds.start !== null && (start === null || bounds.start < start)) start = bounds.start;
    if (bounds.end !== null && (end === null || bounds.end > end)) end = bounds.end;
  }
  return { start, end };
}

function ref(graph: Graph, id: string): RecordRef | undefined {
  const entity = graph.entities.get(id);
  return entity === undefined ? undefined : { id, type: entity.type, name: entity.names.en };
}

/** A claim as read from one record; a derived claim reads through the predicate's inverse. */
function recordClaim(graph: Graph, { claim, subject, derived }: Link): RecordClaim {
  const predicate = graph.vocab.predicates[claim.predicate];
  const otherId = derived ? subject : claim.object;
  const other = otherId === undefined ? undefined : ref(graph, otherId);
  const where = claim.where === undefined ? undefined : ref(graph, claim.where);
  return {
    id: claim.id,
    predicate: derived ? (predicate?.inverse ?? claim.predicate) : claim.predicate,
    label: derived
      ? (predicate?.inverseLabel ?? claim.predicate)
      : (predicate?.label ?? claim.predicate),
    derived,
    ...(other === undefined ? {} : { other }),
    ...(claim.when === undefined ? {} : { when: claim.when, whenText: formatEdtf(claim.when) }),
    ...(where === undefined ? {} : { where }),
    confidence: claim.confidence,
    basis: claim.basis,
    origin: claim.origin,
    audits: {
      count: claim.audits.filter(isPassing).length,
      last: latestAudit(claim.audits)?.on ?? '',
    },
    sources: claim.sources.map(({ key, locator, stance, excerpt }) => ({
      key,
      locator,
      stance,
      excerpt,
    })),
  };
}

function recordSource(source: Source): RecordSource {
  return {
    key: source.key,
    kind: source.kind,
    title: source.title,
    ...(source.authors === undefined ? {} : { authors: source.authors }),
    ...(source.translators === undefined ? {} : { translators: source.translators }),
    ...(source.published === undefined ? {} : { published: source.published }),
    ...(source.written === undefined
      ? {}
      : { written: source.written, writtenText: formatEdtf(source.written) }),
    ...(source.url === undefined ? {} : { url: source.url }),
    ...(source.readingList === true ? { readingList: true as const } : {}),
    ...(source.annotation === undefined ? {} : { annotation: source.annotation }),
  };
}

/** One record per entity, for the record template and its pre-rendered pages. */
export function buildRecords(graph: Graph): EntityRecord[] {
  const links = claimsByEntity(graph);
  const records: EntityRecord[] = [];

  for (const [id, entity] of graph.entities) {
    const entityLinks = links.get(id) ?? [];
    const claims = entityLinks.map((link) => recordClaim(graph, link));
    const sources: Record<string, RecordSource> = {};
    for (const { key } of entityLinks.flatMap((link) => link.claim.sources)) {
      const source = graph.sources.get(key);
      if (source !== undefined && !(key in sources)) sources[key] = recordSource(source);
    }

    records.push({
      id,
      type: entity.type,
      names: entity.names,
      ...(entity.ids === undefined ? {} : { ids: entity.ids }),
      ...(entity.coords === undefined ? {} : { coords: entity.coords }),
      ...(entity.color === undefined ? {} : { color: entity.color }),
      ...(entity.family === undefined ? {} : { family: entity.family }),
      ...(entity.language === undefined ? {} : { language: entity.language }),
      ...(entity.status === undefined ? {} : { status: entity.status }),
      ...(entity.kind === undefined ? {} : { kind: entity.kind }),
      span: spanOf(
        entity.claims.flatMap((claim) => (claim.when === undefined ? [] : [claim.when])),
      ),
      claims,
      sources,
    });
  }

  return records;
}

/** Groups records into their shards: shard name to { id: record }. */
export function shardRecords(records: EntityRecord[]): Map<string, Record<string, EntityRecord>> {
  const shards = new Map<string, Record<string, EntityRecord>>();
  for (const record of records) {
    const shard = shardOf(record.id);
    const entries = shards.get(shard) ?? {};
    entries[record.id] = record;
    shards.set(shard, entries);
  }
  return shards;
}

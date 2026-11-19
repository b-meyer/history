// Typed read API for the site, the map and the qdocs plugins. Node-only parts (loading and
// writing data/) are exported for tools and tests; the browser needs only the types,
// ./dates and ./shard.
export type { MapClaim, MapData, MapEntity, MapLink, MapStay } from './build/mapData.ts';
export type { EntityRecord, RecordClaim, RecordRef, RecordSource } from './build/records.ts';
export { buildMapData } from './build/mapData.ts';
export { buildRecords, shardRecords } from './build/records.ts';
export { writeOutputs, type VocabTerms } from './build/write.ts';
export { formatEdtf, formatYear, parseEdtf, type YearBounds } from './dates.ts';
export {
  claimsByEntity,
  loadGraph,
  type Graph,
  type Link,
  type LoadResult,
  type Problem,
} from './load.ts';
export { ENTITY_TYPES, type EntityType } from './schema/common.ts';
export type { Claim, Entity } from './schema/entity.ts';
export type { Source } from './schema/source.ts';
export {
  BASIS,
  CONFIDENCE,
  ORIGIN,
  STANCE,
  type Basis,
  type Confidence,
  type Predicate,
  type Vocab,
} from './schema/vocab.ts';
export { SHARD_COUNT, shardOf } from './shard.ts';
export { localToday, validateGraph, type ValidateOptions } from './validate.ts';

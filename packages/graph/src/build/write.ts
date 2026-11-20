import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Graph } from '../load.ts';
import type { Vocab } from '../schema/vocab.ts';
import { buildMapData } from './mapData.ts';
import { buildReading } from './reading.ts';
import { buildRecords, shardRecords } from './records.ts';
import { buildSearchRecords } from './searchRecords.ts';

export type WriteSummary = { entities: number; claims: number; shards: number };

/** vocab.json: the reader-facing label and meaning of each confidence and basis value. */
export type VocabTerms = Pick<Vocab, 'confidence' | 'basis'>;

/**
 * Writes the generated files the site reads into outDir (apps/site/public/data/):
 * map.json, vocab.json, record-ids.json, search-records.json, reading.json and records/<shard>.json.
 * Only these paths are replaced.
 */
export function writeOutputs(graph: Graph, outDir: string): WriteSummary {
  const records = buildRecords(graph);
  const shards = shardRecords(records);
  const map = buildMapData(graph);

  const recordsDir = join(outDir, 'records');
  rmSync(recordsDir, { recursive: true, force: true });
  mkdirSync(recordsDir, { recursive: true });

  writeFileSync(join(outDir, 'map.json'), JSON.stringify(map));
  const terms: VocabTerms = { confidence: graph.vocab.confidence, basis: graph.vocab.basis };
  writeFileSync(join(outDir, 'vocab.json'), JSON.stringify(terms));
  writeFileSync(
    join(outDir, 'record-ids.json'),
    JSON.stringify(records.map((record) => record.id).toSorted()),
  );
  writeFileSync(join(outDir, 'search-records.json'), JSON.stringify(buildSearchRecords(records)));
  writeFileSync(join(outDir, 'reading.json'), JSON.stringify(buildReading(graph, records)));
  for (const [shard, entries] of shards) {
    writeFileSync(join(recordsDir, `${shard}.json`), JSON.stringify(entries));
  }

  return { entities: records.length, claims: map.claims.length, shards: shards.size };
}

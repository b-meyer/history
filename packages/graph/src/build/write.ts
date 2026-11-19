import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Graph } from '../load.ts';
import { buildMapData } from './mapData.ts';
import { buildRecords, shardRecords } from './records.ts';

export type WriteSummary = { entities: number; claims: number; shards: number };

/**
 * Writes the generated files the site reads into outDir (apps/site/public/data/):
 * map.json, record-ids.json and records/<shard>.json. Only these paths are replaced.
 */
export function writeOutputs(graph: Graph, outDir: string): WriteSummary {
  const records = buildRecords(graph);
  const shards = shardRecords(records);
  const map = buildMapData(graph);

  const recordsDir = join(outDir, 'records');
  rmSync(recordsDir, { recursive: true, force: true });
  mkdirSync(recordsDir, { recursive: true });

  writeFileSync(join(outDir, 'map.json'), JSON.stringify(map));
  writeFileSync(
    join(outDir, 'record-ids.json'),
    JSON.stringify(records.map((record) => record.id).toSorted()),
  );
  for (const [shard, entries] of shards) {
    writeFileSync(join(recordsDir, `${shard}.json`), JSON.stringify(entries));
  }

  return { entities: records.length, claims: map.claims.length, shards: shards.size };
}

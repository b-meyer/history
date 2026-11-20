import { formatEdtf } from '../dates.ts';
import type { Graph } from '../load.ts';
import type { Source } from '../schema/source.ts';
import type { EntityRecord, RecordRef } from './records.ts';

/** A reading-list source: its fact fields and annotation, and the records that cite it. */
export type ReadingEntry = Omit<Source, 'readingList'> & {
  writtenText?: string;
  records: RecordRef[];
};

const KIND_ORDER = { primary: 0, secondary: 1 } as const;

/**
 * reading.json: every source flagged `readingList`, primary before secondary and then by title.
 * Each lists the records whose claims cite it.
 */
export function buildReading(graph: Graph, records: EntityRecord[]): ReadingEntry[] {
  const citing = new Map<string, RecordRef[]>();
  for (const record of records.toSorted((a, b) => a.id.localeCompare(b.id))) {
    for (const key of Object.keys(record.sources)) {
      const refs = citing.get(key) ?? [];
      refs.push({ id: record.id, type: record.type, name: record.names.en ?? record.id });
      citing.set(key, refs);
    }
  }

  return [...graph.sources.values()]
    .filter((source) => source.readingList === true)
    .toSorted((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title))
    .map((source) => readingEntry(source, citing.get(source.key) ?? []));
}

function readingEntry(source: Source, records: RecordRef[]): ReadingEntry {
  const { readingList: _readingList, ...facts } = source;
  const entry: ReadingEntry = Object.assign(facts, { records });
  if (source.written !== undefined) entry.writtenText = formatEdtf(source.written);
  return entry;
}

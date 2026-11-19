/// <reference types="node" />
// Record data for the /e/<id> pages. The server render reads the generated files from
// public/data/ on disk; the browser fetches the same files. setup.ts loads a record before its
// route resolves, so the server and the hydrating client render from the same data.
import type { EntityRecord, VocabTerms } from 'graph';
import { shardOf } from 'graph/shard';
import { shallowReactive, shallowRef } from 'vue';

/** Records loaded so far, by ID. */
export const records = shallowReactive(new Map<string, EntityRecord>());

/** The confidence and basis wording, once loaded. */
export const vocab = shallowRef<VocabTerms | null>(null);

async function readData<T>(path: string): Promise<T> {
  if (import.meta.env.SSR) {
    const [{ readFile }, { join }] = await Promise.all([
      import('node:fs/promises'),
      import('node:path'),
    ]);
    return JSON.parse(await readFile(join(process.cwd(), 'public', 'data', path), 'utf8')) as T;
  }
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return (await response.json()) as T;
}

const shards = new Map<string, Promise<Record<string, EntityRecord>>>();

function loadShard(shard: string): Promise<Record<string, EntityRecord>> {
  let pending = shards.get(shard);
  if (pending === undefined) {
    pending = readData<Record<string, EntityRecord>>(`records/${shard}.json`);
    // A failed read is forgotten so a later navigation can retry it.
    pending.catch(() => shards.delete(shard));
    shards.set(shard, pending);
  }
  return pending;
}

/** Loads the record with this ID, or returns undefined when there is none. */
export async function loadRecord(id: string): Promise<EntityRecord | undefined> {
  const known = records.get(id);
  if (known !== undefined) return known;
  try {
    const record = (await loadShard(shardOf(id)))[id];
    if (record !== undefined) records.set(id, record);
    return record;
  } catch {
    return undefined;
  }
}

/** Loads vocab.json once; a missing file leaves the raw values on show and is retried later. */
export async function loadVocab(): Promise<void> {
  if (vocab.value !== null) return;
  try {
    vocab.value = await readData<VocabTerms>('vocab.json');
  } catch {
    // Leave the raw values on show.
  }
}

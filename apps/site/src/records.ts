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

/**
 * Loads the record with this ID. Returns undefined when its shard has no such record; throws when
 * the shard cannot be read.
 */
export async function loadRecord(id: string): Promise<EntityRecord | undefined> {
  const known = records.get(id);
  if (known !== undefined) return known;
  const record = (await loadShard(shardOf(id)))[id];
  if (record !== undefined) records.set(id, record);
  return record;
}

/** Loads vocab.json once; throws when it cannot be read, and a later call retries. */
export async function loadVocab(): Promise<void> {
  if (vocab.value !== null) return;
  vocab.value = await readData<VocabTerms>('vocab.json');
}

/**
 * Loads what a record page shows. Strict (the server render) throws when the record is missing or
 * its files cannot be read, which fails the build rather than pre-rendering an empty page. In the
 * browser a failure leaves the page's "No record" message, or the raw confidence and basis values.
 */
export async function loadRecordPage(id: string, strict: boolean): Promise<void> {
  if (!strict) {
    await Promise.allSettled([loadRecord(id), loadVocab()]);
    return;
  }
  const [record] = await Promise.all([loadRecord(id), loadVocab()]);
  if (record === undefined) throw new Error(`record "${id}" is listed but not in its shard`);
}

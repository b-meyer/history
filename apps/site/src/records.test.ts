// @vitest-environment jsdom
import { shardOf } from 'graph/shard';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const VOCAB = {
  confidence: { A: { label: 'Secure', meaning: 'm' } },
  basis: { primary: { label: 'Primary', meaning: 'm' } },
};

let files: Record<string, unknown>;
const fetchMock = vi.fn((url: string) => {
  const path = url.replace(/^.*?data\//u, '');
  return Promise.resolve(
    path in files
      ? { ok: true, status: 200, json: () => Promise.resolve(files[path]) }
      : { ok: false, status: 404, json: () => Promise.resolve({}) },
  );
});

function load(): Promise<typeof import('./records.ts')> {
  vi.resetModules();
  return import('./records.ts');
}

beforeEach(() => {
  files = {
    [`records/${shardOf('plotinus')}.json`]: { plotinus: { id: 'plotinus', names: { en: 'P' } } },
    'vocab.json': VOCAB,
  };
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadRecord', () => {
  it('loads a record from its shard and caches it', async () => {
    const { loadRecord, records } = await load();
    expect(await loadRecord('plotinus')).toMatchObject({ id: 'plotinus' });
    expect(records.get('plotinus')).toMatchObject({ id: 'plotinus' });
    await loadRecord('plotinus');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for an ID its shard lacks', async () => {
    files = { [`records/${shardOf('nobody')}.json`]: {} };
    const { loadRecord } = await load();
    expect(await loadRecord('nobody')).toBeUndefined();
  });

  it('retries a shard that failed to load', async () => {
    const shard = `records/${shardOf('plotinus')}.json`;
    const saved = files[shard];
    delete files[shard];
    const { loadRecord } = await load();
    await expect(loadRecord('plotinus')).rejects.toThrow('404');
    files[shard] = saved;
    expect(await loadRecord('plotinus')).toMatchObject({ id: 'plotinus' });
  });
});

describe('loadRecordPage', () => {
  it('loads the record and the vocabulary', async () => {
    const { loadRecordPage, records, vocab } = await load();
    await loadRecordPage('plotinus', true);
    expect(records.has('plotinus')).toBe(true);
    expect(vocab.value).toEqual(VOCAB);
  });

  it('throws when strict and the record is missing', async () => {
    files[`records/${shardOf('nobody')}.json`] = {};
    const { loadRecordPage } = await load();
    await expect(loadRecordPage('nobody', true)).rejects.toThrow('"nobody"');
  });

  it('throws when strict and a file cannot be read', async () => {
    delete files['vocab.json'];
    const { loadRecordPage } = await load();
    await expect(loadRecordPage('plotinus', true)).rejects.toThrow('404');
  });

  it('settles when not strict, whatever fails', async () => {
    files = {};
    const { loadRecordPage, records, vocab } = await load();
    await expect(loadRecordPage('plotinus', false)).resolves.toBeUndefined();
    expect(records.size).toBe(0);
    expect(vocab.value).toBeNull();
  });
});

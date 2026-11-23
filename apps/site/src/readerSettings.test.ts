import { describe, expect, it } from 'vite-plus/test';
import { AI_PREPAINT_SCRIPT, AI_STORAGE_KEY } from '../readerSettings.ts';
import { isWikiSlug } from './setup.ts';

function run(storage: { getItem: (key: string) => string | null }): string | null {
  let value: string | null = null;
  const document = {
    documentElement: {
      setAttribute: (name: string, v: string) => {
        if (name === 'data-ai') value = v;
      },
    },
  };
  new Function('localStorage', 'document', AI_PREPAINT_SCRIPT)(storage, document);
  return value;
}

describe('pre-paint script', () => {
  it('sets data-ai=off from a stored off', () => {
    expect(run({ getItem: (key) => (key === AI_STORAGE_KEY ? 'off' : null) })).toBe('off');
  });

  it('sets data-ai=on when nothing or on is stored', () => {
    expect(run({ getItem: () => null })).toBe('on');
    expect(run({ getItem: () => 'on' })).toBe('on');
  });

  it('sets data-ai=on when storage throws', () => {
    expect(
      run({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('on');
  });
});

describe('isWikiSlug', () => {
  it('matches the wiki home and its pages only', () => {
    expect(isWikiSlug('wiki')).toBe(true);
    expect(isWikiSlug('wiki/islam/Shia')).toBe(true);
    expect(isWikiSlug('e/porphyry')).toBe(false);
    expect(isWikiSlug('wikipedia')).toBe(false);
    expect(isWikiSlug('about')).toBe(false);
  });
});

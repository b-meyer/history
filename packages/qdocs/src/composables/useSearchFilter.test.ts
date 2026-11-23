// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { ref } from 'vue';
import type { SearchEntry } from './useSearch';
import { setSearchFilter, useSearch } from './useSearch';

const entries: SearchEntry[] = [
  { slug: 'about', pageTitle: 'About', heading: 'Plotinus', headingId: '', level: 1, body: 'x' },
  {
    slug: 'wiki/a/Plotinus',
    pageTitle: 'Plotinus',
    heading: 'Plotinus',
    headingId: '',
    level: 1,
    body: 'x',
  },
];

afterEach(() => {
  setSearchFilter(() => true);
  useSearch().closeSearch();
  useSearch().setQuery('');
  vi.unstubAllGlobals();
});

describe('setSearchFilter', () => {
  it('drops filtered results, live as the filter changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(entries) })),
    );
    const showWiki = ref(true);
    setSearchFilter((entry) => showWiki.value || !entry.slug.startsWith('wiki/'));
    const { openSearch, setQuery, results } = useSearch();
    openSearch();
    await vi.waitFor(() => {
      setQuery('plotinus');
      expect(results.value.length).toBe(2);
    });
    showWiki.value = false;
    expect(results.value.map((r) => r.slug)).toEqual(['about']);
    showWiki.value = true;
    expect(results.value).toHaveLength(2);
  });
});

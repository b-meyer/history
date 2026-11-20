import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const mockExists = vi.mocked(existsSync);
const mockReaddir = vi.mocked(readdirSync);
const mockRead = vi.mocked(readFileSync);
const mockWrite = vi.mocked(writeFileSync);

import {
  buildRouteModuleMap,
  buildSearchIndexEntries,
  buildSitemap,
  expandRouteParams,
  filterPublicRoutes,
} from './sitemap';

describe('expandRouteParams', () => {
  it('substitutes each value into a one-param pattern', () => {
    const result = expandRouteParams(['/', '/e/:id'], { '/e/:id': ['plotinus', 'porphyry'] });
    expect([...result]).toEqual([
      ['/e/plotinus', '/e/:id'],
      ['/e/porphyry', '/e/:id'],
    ]);
  });

  it('gives nothing for a pattern with no entry', () => {
    expect(expandRouteParams(['/e/:id'], { '/x/:id': ['a'] }).size).toBe(0);
    expect(expandRouteParams(['/e/:id']).size).toBe(0);
  });

  it('URL-encodes values', () => {
    expect([...expandRouteParams(['/e/:id'], { '/e/:id': ['a b/c'] }).keys()]).toEqual([
      '/e/a%20b%2Fc',
    ]);
  });

  it('ignores optional and repeatable params', () => {
    expect(expandRouteParams(['/e/:id?'], { '/e/:id?': ['x'] }).size).toBe(0);
    expect(expandRouteParams(['/:path(.*)*'], { '/:path(.*)*': ['x'] }).size).toBe(0);
  });

  it('accepts a param with a custom regex', () => {
    expect([...expandRouteParams(['/n/:n(\\d+)'], { '/n/:n(\\d+)': ['7'] }).keys()]).toEqual([
      '/n/7',
    ]);
  });

  it('ignores patterns with more than one param', () => {
    expect(expandRouteParams(['/:a/:b'], { '/:a/:b': ['x'] }).size).toBe(0);
  });
});

describe('buildRouteModuleMap', () => {
  beforeEach(() => {
    mockExists.mockReset();
  });

  it('maps a plain route to its file', () => {
    mockExists.mockImplementation((p) => String(p).replaceAll('\\', '/') === '/pages/about.md');
    expect(buildRouteModuleMap(['/about'], '/pages', 'src/pages').get('/about')).toBe(
      'src/pages/about.md',
    );
  });

  it('falls back to the pattern file for an expanded route', () => {
    mockExists.mockImplementation((p) => String(p).replaceAll('\\', '/') === '/pages/e/[id].vue');
    const map = buildRouteModuleMap(
      ['/e/plotinus'],
      '/pages',
      'src/pages',
      new Map([['/e/plotinus', '/e/:id']]),
    );
    expect(map.get('/e/plotinus')).toBe('src/pages/e/[id].vue');
  });

  it('leaves a route with no file unmapped', () => {
    mockExists.mockReturnValue(false);
    expect(buildRouteModuleMap(['/x'], '/pages', 'src/pages').has('/x')).toBe(false);
  });
});

describe('filterPublicRoutes', () => {
  beforeEach(() => {
    mockExists.mockReturnValue(false);
  });

  it('excludes dynamic routes with : segment', () => {
    expect(filterPublicRoutes(['/:id'], '/pages')).toEqual([]);
  });

  it('excludes wildcard routes with *', () => {
    expect(filterPublicRoutes(['/404/*'], '/pages')).toEqual([]);
  });

  it('excludes routes where no file is found', () => {
    expect(filterPublicRoutes(['/missing'], '/pages')).toEqual([]);
  });

  it('includes .vue pages without reading their content', () => {
    mockExists.mockImplementation((p) => String(p).endsWith('.vue'));
    expect(filterPublicRoutes(['/about'], '/pages')).toEqual(['/about']);
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('excludes .md pages with hidden: true frontmatter', () => {
    mockExists.mockImplementation((p) => String(p).endsWith('.md'));
    mockRead.mockReturnValue('---\nhidden: true\n---\n# Secret' as unknown as Buffer);
    expect(filterPublicRoutes(['/secret'], '/pages')).toEqual([]);
  });

  it('includes .md pages without hidden frontmatter', () => {
    mockExists.mockImplementation((p) => String(p).endsWith('.md'));
    mockRead.mockReturnValue('# Page\nContent' as unknown as Buffer);
    expect(filterPublicRoutes(['/page'], '/pages')).toEqual(['/page']);
  });
});

describe('buildSitemap', () => {
  const ORIG_ENV = process.env.PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.PUBLIC_SITE_URL;
    mockWrite.mockReset();
  });

  afterEach(() => {
    if (ORIG_ENV === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = ORIG_ENV;
    }
  });

  it('uses the default hostname when no env var or option is set', () => {
    buildSitemap('/out', ['/']);
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toContain('http://localhost:5173/');
  });

  it('prefers the options hostname over the default', () => {
    buildSitemap('/out', ['/'], { hostname: 'https://example.com' });
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toContain('https://example.com/');
  });

  it('prefers PUBLIC_SITE_URL env var over options hostname', () => {
    process.env.PUBLIC_SITE_URL = 'https://env.example.com';
    buildSitemap('/out', ['/'], { hostname: 'https://opts.example.com' });
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toContain('https://env.example.com/');
    expect(xml).not.toContain('opts.example.com');
  });

  it('XML-escapes ampersands in URLs', () => {
    buildSitemap('/out', ['/foo&bar'], { hostname: 'https://example.com' });
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toContain('&amp;');
    expect(xml).not.toContain('foo&bar');
  });

  it('produces an empty urlset for an empty path list', () => {
    buildSitemap('/out', [], { hostname: 'https://example.com' });
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toContain('<urlset');
    expect(xml).not.toContain('<url>');
  });

  it('writes to sitemap.xml in the output directory', () => {
    buildSitemap('/out', ['/']);
    expect(String(mockWrite.mock.calls[0]?.[0])).toContain('sitemap.xml');
  });

  it('includes a <lastmod> element with a YYYY-MM-DD date', () => {
    buildSitemap('/out', ['/'], { hostname: 'https://example.com' });
    const xml = String(mockWrite.mock.calls[0]?.[1]);
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/u);
  });
});

describe('buildSearchIndexEntries', () => {
  beforeEach(() => {
    mockReaddir.mockReturnValue([] as unknown as ReturnType<typeof readdirSync>);
  });

  it('returns empty array when no files are present', () => {
    expect(buildSearchIndexEntries('/pages')).toEqual([]);
  });

  it('skips files with dynamic slugs ([, *, :)', () => {
    mockReaddir.mockReturnValue(['[id].md', '[...all].md', ':param.md'] as unknown as ReturnType<
      typeof readdirSync
    >);
    expect(buildSearchIndexEntries('/pages')).toEqual([]);
  });

  it('skips files with hidden: true frontmatter', () => {
    mockReaddir.mockReturnValue(['hidden.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('---\nhidden: true\n---\n# Secret' as unknown as Buffer);
    expect(buildSearchIndexEntries('/pages')).toEqual([]);
  });

  it('appends the entries of a searchEntries file', () => {
    mockReaddir.mockReturnValue(['index.md'] as unknown as ReturnType<typeof readdirSync>);
    const record = {
      slug: 'e/archytas',
      pageTitle: 'Person',
      heading: 'Archytas',
      headingId: '',
      level: 1,
      body: '',
      entity: 'archytas',
      origin: 'record',
    };
    mockRead.mockImplementation(((file: string) =>
      file === '/data/search-records.json'
        ? JSON.stringify([record])
        : '# Home\nWelcome.') as unknown as typeof readFileSync);
    const entries = buildSearchIndexEntries('/pages', '/data/search-records.json');
    expect(entries).toHaveLength(2);
    expect(entries[1]).toEqual(record);
  });

  it('skips a missing searchEntries file', () => {
    mockReaddir.mockReturnValue(['index.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockImplementation(((file: string) => {
      if (file === '/data/missing.json') throw new Error('ENOENT');
      return '# Home\nWelcome.';
    }) as unknown as typeof readFileSync);
    expect(buildSearchIndexEntries('/pages', '/data/missing.json')).toHaveLength(1);
  });

  it('uses the H1 heading as the page title', () => {
    mockReaddir.mockReturnValue(['index.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('# Home\nWelcome text.' as unknown as Buffer);
    const entries = buildSearchIndexEntries('/pages');
    expect(entries[0]?.pageTitle).toBe('Home');
  });

  it('creates entries for H1 and H2 headings', () => {
    mockReaddir.mockReturnValue(['page.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('# Title\n## Section\nBody text.' as unknown as Buffer);
    const entries = buildSearchIndexEntries('/pages');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ level: 1, headingId: '' });
    expect(entries[1]).toMatchObject({ level: 2, heading: 'Section' });
  });

  it('deduplicates headings with the same text', () => {
    mockReaddir.mockReturnValue(['page.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('# Title\n## Overview\n## Overview\n## Overview' as unknown as Buffer);
    const entries = buildSearchIndexEntries('/pages');
    const ids = entries.filter((e) => e.level === 2).map((e) => e.headingId);
    expect(ids[0]).toBe('overview');
    expect(ids[1]).toBe('overview-1');
    expect(ids[2]).toBe('overview-2');
  });

  it('skips "See also" headings', () => {
    mockReaddir.mockReturnValue(['page.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('# Title\n## See also\nLinks here.' as unknown as Buffer);
    const entries = buildSearchIndexEntries('/pages');
    expect(entries.every((e) => e.heading !== 'See also')).toBe(true);
  });

  it('indexes .vue pages as a single title-only entry using the slug', () => {
    mockReaddir.mockReturnValue(['Watchers.vue'] as unknown as ReturnType<typeof readdirSync>);
    const entries = buildSearchIndexEntries('/pages');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      slug: 'Watchers',
      pageTitle: 'Watchers',
      heading: 'Watchers',
      headingId: '',
      level: 1,
      body: '',
    });
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('skips .vue pages with dynamic slugs', () => {
    mockReaddir.mockReturnValue(['[id].vue'] as unknown as ReturnType<typeof readdirSync>);
    expect(buildSearchIndexEntries('/pages')).toEqual([]);
  });

  it('indexes files in subdirectories with a path-prefixed slug', () => {
    mockReaddir.mockReturnValue(['guide/intro.md'] as unknown as ReturnType<typeof readdirSync>);
    mockRead.mockReturnValue('# Intro\nBody.' as unknown as Buffer);
    const entries = buildSearchIndexEntries('/pages');
    expect(entries[0]?.slug).toBe('guide/intro');
    expect(entries[0]?.pageTitle).toBe('Intro');
  });
});

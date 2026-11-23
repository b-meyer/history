import { readFileSync } from 'node:fs';
import { defineConfig } from 'qdocs/vite';
import { leadsPlugin } from './leadsPlugin.ts';
import { loadStartYears, loadWikiData, loadWikiSidebars } from './wikiData.ts';
import { wikiProvenance } from './wikiProvenance.ts';

// The entity IDs `graph build` wrote, one pre-rendered /e/<id> page each. Empty before the first
// graph build (the site's dev and build scripts run it first).
function readIds(): string[] {
  try {
    return JSON.parse(
      readFileSync(new URL('public/data/record-ids.json', import.meta.url), 'utf8'),
    ) as string[];
  } catch {
    return [];
  }
}

function memoize<T>(load: () => T): () => T {
  let value: { v: T } | undefined;
  return () => (value ??= { v: load() }).v;
}

const wiki = loadWikiSidebars();
const startYears = memoize(loadStartYears);

export default defineConfig({
  title: 'History',
  description: 'A map and wiki of how ideas and traditions moved across time and place.',
  base: '/',
  branding: {
    siteTitle: 'History',
  },
  nav: [
    { text: 'Map', link: '/map' },
    { text: 'Reading List', link: '/reading' },
    { text: 'About', link: '/about' },
  ],
  // graph build writes one entry per record, so search finds records as well as pages.
  searchEntries: 'public/data/search-records.json',
  // The map package's components carry Tailwind classes; Tailwind scans only the app by default.
  tailwindSources: ['../../packages/map/src'],
  markdown: {
    mermaid: true,
  },
  // [@key] notes and [[id]] links in wiki pages; read from data/ on the first page that uses them.
  citations: memoize(loadWikiData),
  // The line under each wiki page title: AI assistance, audit date, Show on map.
  pageNotice: wikiProvenance((entity) => startYears()(entity)),
  // Records have no sidebar: the longest prefix wins, so /e/ pages get the empty tree. Each wiki
  // collection gets its own tree, built from the pages' frontmatter.
  sidebar: {
    '/e/': [],
    '/': [{ path: 'index', title: 'Home' }, ...wiki.homeEntry],
    ...wiki.trees,
  },
  setup: './src/setup.ts',
  routeParams: { '/e/:id': readIds() },
  // dev:leads only; see leadsPlugin.ts.
  plugins: [leadsPlugin()],
  server: { port: 48460 },
  preview: { port: 48460 },
  test: {
    include: ['src/**/*.test.ts'],
    pool: 'threads',
    clearMocks: true,
    restoreMocks: true,
  },
  run: { tasks: { test: { command: 'vp test' } } },
});

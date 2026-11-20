import { readFileSync } from 'node:fs';
import { defineConfig } from 'qdocs/vite';
import { leadsPlugin } from './leadsPlugin.ts';

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

export default defineConfig({
  title: 'History',
  description: 'A map and wiki of how ideas and traditions moved across time and place.',
  base: '/',
  branding: {
    siteTitle: 'History',
  },
  nav: [{ text: 'Map', link: '/map' }],
  // The map package's components carry Tailwind classes; Tailwind scans only the app by default.
  tailwindSources: ['../../packages/map/src'],
  markdown: {
    mermaid: true,
  },
  // Records have no sidebar: the longest prefix wins, so /e/ pages get the empty tree.
  sidebar: { '/e/': [], '/': [{ path: 'index', title: 'Home' }] },
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

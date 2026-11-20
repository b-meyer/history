import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildLeadMapData, loadGraph, readLeads } from 'graph';
import { LEADS_URL } from 'map/url';
import type { Plugin } from 'vite';

/**
 * dev:leads only: serves the library's Wikidata leads as map data at LEADS_URL. It applies to
 * the dev server in `--mode leads` and to nothing else, so no build ever sees lead data.
 * LIBRARY_DIR names the library checkout.
 */
export function leadsPlugin(): Plugin {
  return {
    name: 'history:leads',
    apply: (_config, env) => env.command === 'serve' && env.mode === 'leads',
    configureServer(server) {
      const libraryDir = process.env['LIBRARY_DIR'] ?? '';
      if (libraryDir === '' || !existsSync(resolve(libraryDir, 'leads'))) {
        server.config.logger.warn(
          'dev:leads: set LIBRARY_DIR to a library checkout with leads/ to see leads.',
        );
      }
      const dataDir = resolve(server.config.root, '../../data');
      server.middlewares.use(LEADS_URL, (_request, response) => {
        const { graph } = loadGraph(dataDir);
        const map = buildLeadMapData(libraryDir === '' ? [] : readLeads(libraryDir), graph.vocab);
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify(map));
      });
    },
  };
}

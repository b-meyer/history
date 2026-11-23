import { fileURLToPath } from 'node:url';
import { articleRoutes, loadGraph, readWikiPages } from 'graph';
import type { CitationData } from 'qdocs/citations';

const PAGES = fileURLToPath(new URL('src/pages/', import.meta.url));
const DATA = fileURLToPath(new URL('../../data', import.meta.url));

/**
 * Wiki data for the citations plugin: source fields, entity names and entity home articles. A
 * repeated or unknown `entity:` is reported by `graph validate`, which the site's dev and build
 * scripts run first.
 */
export function loadWikiData(): CitationData {
  const { graph } = loadGraph(DATA);
  return {
    sources: graph.sources,
    entityNames: new Map([...graph.entities].map(([id, entity]) => [id, entity.names.en])),
    articles: articleRoutes(readWikiPages(PAGES)),
  };
}

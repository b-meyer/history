import { fileURLToPath } from 'node:url';
import { articleRoutes, buildRecords, loadGraph, readWikiPages } from 'graph';
import type { CitationData } from 'qdocs/citations';
import type { StartYear } from './wikiProvenance.ts';
import { buildWikiSidebars } from './wikiSidebar.ts';

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

/** The first year of each entity's dated claims, for the "Show on map" link. */
export function loadStartYears(): StartYear {
  const spans = new Map(
    buildRecords(loadGraph(DATA).graph).map((record) => [
      record.id,
      record.span.start ?? record.span.end,
    ]),
  );
  return (entity) => spans.get(entity);
}

/**
 * The sidebar trees for /wiki/, one per collection, from the pages' frontmatter, plus the entry that
 * leads to the wiki from the other trees when it has a home page. Read when the config loads, so a
 * new page shows after the dev server restarts.
 */
export function loadWikiSidebars(): {
  trees: ReturnType<typeof buildWikiSidebars>;
  homeEntry: { path: string; title: string }[];
} {
  const pages = readWikiPages(PAGES);
  return {
    trees: buildWikiSidebars(pages),
    homeEntry: pages.some((page) => page.path === 'wiki/index')
      ? [{ path: 'wiki', title: 'Wiki' }]
      : [],
  };
}

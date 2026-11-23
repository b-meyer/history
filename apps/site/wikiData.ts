import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from 'graph';
import type { CitationData } from 'qdocs/citations';

const PAGES = fileURLToPath(new URL('src/pages/', import.meta.url));
const DATA = fileURLToPath(new URL('../../data', import.meta.url));

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return markdownFiles(join(dir, entry.name));
    return entry.name.endsWith('.md') ? [join(dir, entry.name)] : [];
  });
}

/** The route of a page file: pages/wiki/islam/index.md is /wiki/islam. */
function routeOf(file: string): string {
  const path = relative(PAGES, file).split('\\').join('/');
  return `/${path.replace(/\.md$/u, '').replace(/(?:^|\/)index$/u, '')}`;
}

/** Entity ID to the route of the page whose frontmatter names it in `entity:`. */
function readArticles(): Map<string, string> {
  const articles = new Map<string, string>();
  for (const file of markdownFiles(PAGES)) {
    const front = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(readFileSync(file, 'utf8'))?.[1] ?? '';
    const id = /^entity:\s*['"]?([a-z0-9-]+)['"]?\s*$/mu.exec(front)?.[1];
    if (id === undefined) continue;
    const route = routeOf(file);
    const existing = articles.get(id);
    if (existing !== undefined) {
      throw new Error(`entity "${id}" is the home article of both ${existing} and ${route}`);
    }
    articles.set(id, route);
  }
  return articles;
}

/** Wiki data for the citations plugin: source fields, entity names and entity home articles. */
export function loadWikiData(): CitationData {
  const { graph } = loadGraph(DATA);
  return {
    sources: graph.sources,
    entityNames: new Map([...graph.entities].map(([id, entity]) => [id, entity.names.en])),
    articles: readArticles(),
  };
}

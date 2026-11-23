import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import type { Graph, Problem } from './load.ts';
import { citationsSchema, type CiteEntry } from './schema/citations.ts';
import { findWikiRefs, type WikiRefs } from './wikiSyntax.ts';

/** One markdown page of the wiki. */
export type WikiPage = {
  /** Path from the pages root without extension, forward slashes: wiki/platonism/Iamblichus. */
  path: string;
  /** The page's route: /wiki/platonism/Iamblichus, or /wiki/platonism for an index.md. */
  route: string;
  /** The entity this page is the home article of, from frontmatter `entity:`. */
  entity?: string | undefined;
  refs: WikiRefs;
};

export type WikiPaths = {
  /** apps/site/src/pages. */
  pagesDir: string;
  /** data/. */
  dataDir: string;
};

const slashes = (path: string): string => path.split('\\').join('/');

function filesWithExtension(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      if (entry.isDirectory()) return filesWithExtension(join(dir, entry.name), extension);
      return entry.name.endsWith(extension) ? [join(dir, entry.name)] : [];
    });
}

function splitFrontmatter(text: string): { front: string; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u.exec(text);
  if (!match) return { front: '', body: text };
  return { front: match[1] ?? '', body: text.slice(match[0].length) };
}

function entityOf(front: string): string | undefined {
  try {
    const data = parse(front, { schema: 'failsafe' }) as { entity?: unknown } | null;
    return typeof data?.entity === 'string' && data.entity !== '' ? data.entity : undefined;
  } catch {
    // Unreadable frontmatter fails the site build by itself.
    return undefined;
  }
}

/** Reads every page under `<pagesDir>/wiki`. */
export function readWikiPages(pagesDir: string): WikiPage[] {
  return filesWithExtension(join(pagesDir, 'wiki'), '.md').map((file) => {
    const path = slashes(relative(pagesDir, file)).replace(/\.md$/u, '');
    const { front, body } = splitFrontmatter(readFileSync(file, 'utf8'));
    return {
      path,
      route: `/${path.replace(/(?:^|\/)index$/u, '')}`,
      entity: entityOf(front),
      refs: findWikiRefs(body),
    };
  });
}

/** Entity ID to the route of its home article. The first page wins; validateWiki reports repeats. */
export function articleRoutes(pages: WikiPage[]): Map<string, string> {
  const routes = new Map<string, string>();
  for (const page of pages) {
    if (page.entity !== undefined && !routes.has(page.entity)) routes.set(page.entity, page.route);
  }
  return routes;
}

function readEntries(file: string, shown: string, problems: Problem[]): CiteEntry[] | null {
  let raw: unknown;
  try {
    raw = parse(readFileSync(file, 'utf8'), { schema: 'failsafe' });
  } catch (error) {
    const message = (error as Error).message.split('\n')[0] ?? '';
    problems.push({ file: shown, at: '', message: `not valid YAML: ${message}` });
    return null;
  }
  const result = citationsSchema.safeParse(raw ?? []);
  if (result.success) return result.data;
  for (const issue of result.error.issues)
    problems.push({ file: shown, at: issue.path.join('.'), message: issue.message });
  return null;
}

const label = (key: string, locator: string): string =>
  locator === '' ? key : `${key}, ${locator}`;

function checkRefs(page: WikiPage, graph: Graph, pageFile: string, problems: Problem[]): void {
  for (const { key, locator } of page.refs.cites) {
    if (!graph.sources.has(key))
      problems.push({
        file: pageFile,
        at: `[@${label(key, locator)}]`,
        message: `unknown source key "${key}"`,
      });
  }
  for (const id of page.refs.entities) {
    if (!graph.entities.has(id))
      problems.push({ file: pageFile, at: `[[${id}]]`, message: `unknown entity ID "${id}"` });
  }
}

function checkEntries(
  page: WikiPage,
  entries: CiteEntry[],
  files: { page: string; entries: string },
  problems: Problem[],
): void {
  for (const [index, cite] of page.refs.cites.entries()) {
    const entry = entries[index];
    if (entry === undefined) {
      problems.push({
        file: files.page,
        at: `[@${label(cite.key, cite.locator)}]`,
        message: `cite ${index + 1} has no excerpt entry in ${files.entries}`,
      });
    } else if (entry.key !== cite.key || entry.locator !== cite.locator) {
      problems.push({
        file: files.entries,
        at: String(index),
        message: `entry ${index + 1} is ${label(entry.key, entry.locator)}, but ${files.page} cites ${label(cite.key, cite.locator)} there`,
      });
    }
  }
  for (const [index, entry] of [...entries.entries()].slice(page.refs.cites.length)) {
    problems.push({
      file: files.entries,
      at: String(index),
      message: `stale entry ${label(entry.key, entry.locator)}: ${files.page} has no such cite`,
    });
  }
}

function checkEntity(
  page: WikiPage,
  graph: Graph,
  pageFile: string,
  claimed: Map<string, string>,
  problems: Problem[],
): void {
  if (page.entity === undefined) return;
  const other = claimed.get(page.entity);
  if (other === undefined) claimed.set(page.entity, pageFile);
  else
    problems.push({
      file: pageFile,
      at: 'entity',
      message: `"${page.entity}" is already the home article of ${other}`,
    });
  if (!graph.entities.has(page.entity))
    problems.push({
      file: pageFile,
      at: 'entity',
      message: `unknown entity ID "${page.entity}"`,
    });
}

/**
 * Checks the wiki pages against the graph and their citations files: unknown source keys and entity
 * IDs, home-article entities that are repeated or not in the graph, and the match between a page's
 * cites and the entries of data/citations/<page path without the wiki/ prefix>.yaml.
 */
export function validateWiki(graph: Graph, paths: WikiPaths): Problem[] {
  const problems: Problem[] = [];
  const claimed = new Map<string, string>();
  const expected = new Set<string>();

  for (const page of readWikiPages(paths.pagesDir)) {
    const pageFile = `apps/site/src/pages/${page.path}.md`;
    checkRefs(page, graph, pageFile, problems);
    checkEntity(page, graph, pageFile, claimed, problems);

    const citationPath = page.path.replace(/^wiki\//u, '');
    const entriesFile = `data/citations/${citationPath}.yaml`;
    const file = join(paths.dataDir, 'citations', `${citationPath}.yaml`);
    expected.add(slashes(file));
    if (existsSync(file)) {
      const entries = readEntries(file, entriesFile, problems);
      if (entries !== null)
        checkEntries(page, entries, { page: pageFile, entries: entriesFile }, problems);
    } else if (page.refs.cites.length > 0) {
      const count = page.refs.cites.length;
      problems.push({
        file: pageFile,
        at: 'citations',
        message: `has ${count} cite${count === 1 ? '' : 's'} but ${entriesFile} does not exist`,
      });
    }
  }

  for (const file of filesWithExtension(join(paths.dataDir, 'citations'), '.yaml')) {
    if (!expected.has(slashes(file)))
      problems.push({
        file: `data/${slashes(relative(paths.dataDir, file))}`,
        at: '',
        message: 'no wiki page for this citations file',
      });
  }
  return problems;
}

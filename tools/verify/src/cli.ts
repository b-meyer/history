import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findOverlaps, sourceGrams } from './overlap.ts';
import {
  checkItems,
  collectItems,
  libraryText,
  type Library,
  openLibrary,
  type Problem,
  readItems,
  writeEdits,
} from './quoteCheck.ts';

// vp run verify [--write] [--root <dir>]: the quote check and the overlap flag against the library checkout in
// LIBRARY_DIR. Without --write nothing is changed. With it, the `passage` hash of every matched
// source is filled or updated, and nothing else in the YAML files moves. --root points at another
// checkout of the repo's data/ and pages (used to try --write on a copy).

const CITE = /\[@([a-z0-9]+(?:-[a-z0-9]+)*)/gu;

/** The keys a wiki page cites: its `[@key]` notes and its data/citations file, if any. */
function citedKeys(root: string, file: string, md: string): Set<string> {
  const keys = new Set([...md.matchAll(CITE)].map((match) => match[1] ?? ''));
  const citations = join(root, 'data', 'citations', file.replace(/\.md$/u, '.yaml'));
  if (existsSync(citations)) {
    for (const item of readItems(citations, readFileSync(citations, 'utf8'))) keys.add(item.key);
  }
  return keys;
}

/** Overlap problems for every wiki page. */
export function checkWiki(root: string, library: Library): Problem[] {
  const wikiDir = join(root, 'apps', 'site', 'src', 'pages', 'wiki');
  if (!existsSync(wikiDir)) return [];
  const grams = new Map<string, Set<string> | undefined>();
  const gramsOf = (key: string) => {
    if (!grams.has(key)) {
      const md = libraryText(library, key);
      grams.set(key, md === undefined ? undefined : sourceGrams(md));
    }
    return grams.get(key);
  };
  return readdirSync(wikiDir, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.md'))
    .toSorted()
    .flatMap((name) => {
      const file = name.replaceAll('\\', '/');
      const md = readFileSync(join(wikiDir, file), 'utf8');
      const page = `apps/site/src/pages/wiki/${file}`;
      return [...citedKeys(root, file, md)].flatMap((key) => {
        const set = gramsOf(key);
        return set === undefined ? [] : findOverlaps(page, md, set);
      });
    });
}

function main(): void {
  const write = process.argv.includes('--write');
  const at = process.argv.indexOf('--root');
  const root = resolve(
    at === -1 ? join(import.meta.dirname, '..', '..', '..') : (process.argv[at + 1] ?? ''),
  );
  let library: Library;
  try {
    library = openLibrary(process.env['LIBRARY_DIR']);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const items = collectItems(root);
  const result = checkItems(items, library, write);
  if (write) writeEdits(root, result.edits);
  const problems = [...result.problems, ...checkWiki(root, library)];
  for (const problem of problems) {
    console.error(`${problem.type}: ${problem.where}: ${problem.message}`);
  }
  const counts = new Map<string, number>();
  for (const problem of problems) counts.set(problem.type, (counts.get(problem.type) ?? 0) + 1);
  const summary = [...counts].map(([type, count]) => `${type} ${count}`).join(', ');
  const wrote = write ? `, ${result.filled} passage hash(es) written` : '';
  console.info(
    `${items.length} excerpt(s) checked, ${problems.length} problem(s)${summary === '' ? '' : ` (${summary})`}${wrote}`,
  );
  if (problems.length > 0) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === import.meta.filename) main();

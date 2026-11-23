import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isMap, isScalar, type Pair, parseDocument, visit, type YAMLMap } from 'yaml';
import { collapse, LocatorError, locateParagraphs, paragraphLabels } from './locate.ts';

// The quote check: every claim source in data/entities/ and every cite in data/citations/ is
// {key, locator, excerpt, passage?}. The excerpt must lie inside the span its locator names in the
// library's sources/<key>/text.md (read only). Only the `passage` hash is ever written back.
//
// The passage hash identifies the matched passage: the paragraphs of text.md that the excerpt
// touches, first to last, inside the span. It is the first 16 hex digits of the SHA-256 of those
// paragraphs, whitespace-collapsed (NFC) and joined by one space. It moves only when that text does.

export type ProblemType =
  | 'no-text'
  | 'bad-locator'
  | 'locator-unresolved'
  | 'excerpt-outside-locator'
  | 'stale-passage'
  | 'unwritable'
  | 'overlap';

export type Problem = { type: ProblemType; where: string; message: string };

/** One edit to a YAML file's text: replace [start, end) with `text`. */
export type Edit = { start: number; end: number; text: string };

export type Item = {
  /** Path relative to the repo root, with forward slashes. */
  file: string;
  /** The claim id, or `cite <n>` for the n-th cite of a citations file. */
  label: string;
  key: string;
  locator: string;
  excerpt: string;
  passage?: string;
  /** How to write a hash into the file, or why it cannot be written. */
  write: ((hash: string) => Edit) | string;
};

/** The passage hash of the paragraphs an excerpt touches. */
export function passageHash(paragraphs: readonly string[]): string {
  return createHash('sha256').update(paragraphs.join(' ')).digest('hex').slice(0, 16);
}

export function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => join(dir, name))
    .toSorted();
}

function text(map: YAMLMap, name: string): string | undefined {
  const node = map.get(name, true);
  return isScalar(node) && typeof node.value === 'string' ? node.value : undefined;
}

function writer(source: string, map: YAMLMap): Item['write'] {
  if (map.flow === true) return 'a flow-style source cannot be edited in place';
  const existing = map.items.find((pair) => isScalar(pair.key) && pair.key.value === 'passage');
  const existingRange = isScalar(existing?.value) ? existing.value.range : undefined;
  if (existingRange) {
    return (hash) => ({ start: existingRange[0], end: existingRange[1], text: hash });
  }
  const first: Pair | undefined = map.items[0];
  const last: Pair | undefined = map.items.at(-1);
  const keyAt = isScalar(first?.key) ? first.key.range?.[0] : undefined;
  const valueEnd = isScalar(last?.value) ? last.value.range?.[1] : undefined;
  if (keyAt === undefined || valueEnd === undefined) return 'no scalar value to insert after';
  const indent = ' '.repeat(keyAt - (source.lastIndexOf('\n', keyAt - 1) + 1));
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return (hash) => {
    const line = `${indent}passage: ${hash}`;
    if (source[valueEnd - 1] === '\n') return { start: valueEnd, end: valueEnd, text: line + eol };
    const lineEnd = source.indexOf('\n', valueEnd);
    if (lineEnd === -1) return { start: source.length, end: source.length, text: eol + line };
    return { start: lineEnd + 1, end: lineEnd + 1, text: line + eol };
  };
}

/** Every {key, locator, excerpt} map in one YAML file, in file order. */
export function readItems(file: string, source: string): Item[] {
  const items: Item[] = [];
  const doc = parseDocument(source, { schema: 'failsafe' });
  visit(doc, {
    Map(_, map, path) {
      const key = text(map, 'key');
      const locator = text(map, 'locator') ?? '';
      const excerpt = text(map, 'excerpt');
      if (key === undefined || excerpt === undefined) return;
      const claim = path.findLast((node) => isMap(node) && text(node, 'id') !== undefined);
      const id = isMap(claim) ? text(claim, 'id') : undefined;
      const item: Item = {
        file,
        label: id ?? `cite ${items.length + 1}`,
        key,
        locator,
        excerpt,
        write: writer(source, map),
      };
      const passage = text(map, 'passage');
      if (passage !== undefined) item.passage = passage;
      items.push(item);
    },
  });
  return items;
}

/** Every item under data/entities/ and data/citations/. */
export function collectItems(root: string): Item[] {
  return ['entities', 'citations'].flatMap((folder) =>
    yamlFiles(join(root, 'data', folder)).flatMap((path) =>
      readItems(relative(root, path).replaceAll('\\', '/'), readFileSync(path, 'utf8')),
    ),
  );
}

export type Library = { dir: string; texts: Map<string, string | undefined> };

export function openLibrary(dir?: string): Library {
  if (dir === undefined || dir === '') {
    throw new Error('LIBRARY_DIR is not set; point it at the library checkout.');
  }
  if (!existsSync(join(dir, 'sources'))) {
    throw new Error(`LIBRARY_DIR '${dir}' is not a library checkout (it has no sources/ folder).`);
  }
  return { dir, texts: new Map() };
}

/** The key's text.md, read only, or undefined when the library has none. */
export function libraryText(library: Library, key: string): string | undefined {
  if (!library.texts.has(key)) {
    const path = join(library.dir, 'sources', key, 'text.md');
    library.texts.set(key, existsSync(path) ? readFileSync(path, 'utf8') : undefined);
  }
  return library.texts.get(key);
}

type Match = { hash: string } | { problem: Problem };

function elsewhere(md: string, excerpt: string): string {
  let joined = '';
  const starts: { at: number; label: string }[] = [];
  for (const paragraph of paragraphLabels(md)) {
    starts.push({ at: joined.length, label: paragraph.label });
    joined += `${paragraph.text} `;
  }
  const found = joined.indexOf(excerpt);
  if (found === -1) return 'not found anywhere in the text';
  const label = starts.findLast((entry) => entry.at <= found)?.label ?? '?';
  return `found elsewhere, at ${label}`;
}

function whereOf(item: Item): string {
  return `${item.file} ${item.label} [${item.key}, ${item.locator}]`;
}

/** Finds one item's excerpt within its locator, or says why not. */
export function matchItem(item: Item, library: Library): Match {
  const where = whereOf(item);
  const problem = (type: ProblemType, message: string): Match => ({
    problem: { type, where, message },
  });
  const md = libraryText(library, item.key);
  if (md === undefined) return problem('no-text', `the library has no text.md for '${item.key}'`);
  let spans: string[][];
  try {
    // A cite whose page gave no locator may match anywhere in the text.
    spans =
      item.locator === ''
        ? [paragraphLabels(md).map((paragraph) => paragraph.text)]
        : locateParagraphs(md, item.locator);
  } catch (error) {
    if (!(error instanceof LocatorError)) throw error;
    return problem('bad-locator', error.message);
  }
  if (spans.length === 0) {
    return problem('locator-unresolved', `locator names nothing in '${item.key}'`);
  }
  const excerpt = collapse(item.excerpt);
  for (const span of spans) {
    const found = span.join(' ').indexOf(excerpt);
    if (found === -1) continue;
    const end = found + excerpt.length;
    let at = 0;
    const touched = span.filter((paragraph) => {
      const start = at;
      at += paragraph.length + 1;
      return start < end && at > found;
    });
    return { hash: passageHash(touched) };
  }
  const head = excerpt.split(' ').slice(0, 10).join(' ');
  return problem(
    'excerpt-outside-locator',
    `excerpt not within the locator (${elsewhere(md, excerpt)}): ${head}`,
  );
}

export type CheckResult = { problems: Problem[]; edits: Map<string, Edit[]>; filled: number };

/**
 * Checks every item. With `write`, a missing or different passage hash becomes an edit for
 * `writeEdits`; without it a different hash is a stale-passage problem and a missing one is fine.
 */
export function checkItems(items: readonly Item[], library: Library, write: boolean): CheckResult {
  const result: CheckResult = { problems: [], edits: new Map(), filled: 0 };
  for (const item of items) {
    const match = matchItem(item, library);
    if ('problem' in match) {
      result.problems.push(match.problem);
      continue;
    }
    if (item.passage === match.hash) continue;
    const where = whereOf(item);
    if (!write) {
      if (item.passage !== undefined) {
        const message = `passage ${item.passage} is stale; the text now hashes to ${match.hash}`;
        result.problems.push({ type: 'stale-passage', where, message });
      }
      continue;
    }
    if (typeof item.write === 'string') {
      result.problems.push({ type: 'unwritable', where, message: item.write });
      continue;
    }
    const edits = result.edits.get(item.file) ?? [];
    edits.push(item.write(match.hash));
    result.edits.set(item.file, edits);
    result.filled += 1;
  }
  return result;
}

/** Applies edits to one file's text, last first so offsets hold. */
export function applyEdits(source: string, edits: readonly Edit[]): string {
  return edits
    .toSorted((a, b) => b.start - a.start)
    .reduce((out, edit) => out.slice(0, edit.start) + edit.text + out.slice(edit.end), source);
}

export function writeEdits(root: string, edits: ReadonlyMap<string, Edit[]>): void {
  for (const [file, list] of edits) {
    const path = join(root, file);
    writeFileSync(path, applyEdits(readFileSync(path, 'utf8'), list));
  }
}

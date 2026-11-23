import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import {
  applyEdits,
  checkItems,
  collectItems,
  openLibrary,
  passageHash,
  readItems,
  writeEdits,
} from './quoteCheck.ts';

let root: string;
let lib: string;

const TEXT = `---
key: dl
original: dl.html
extractor: html
---

Preamble words here.

<!-- ref DL 8.79 -->

Archytas of Tarentum was another
of the Pythagoreans.

He was generalissimo of his city seven times.

<!-- ref DL 8.80 -->

Other matter entirely.
`;

const ENTITY = `id: archytas
type: person
claims:
  - id: archytas.member-of.pythagoreans
    predicate: member-of
    # a hand-written comment
    sources:
      - key: dl
        locator: DL 8.79
        stance: asserts
        excerpt: 'was another of the Pythagoreans.'
        passage: stale
      - key: dl
        locator: DL 8.79
        stance: asserts
        excerpt: "generalissimo of his city"   # trailing comment
    audits: []
`;

const CITES = `- key: dl
  locator: DL 8.80
  excerpt: Other matter entirely.
- key: dl
  locator: ''
  excerpt: Preamble words
`;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'verify-root-'));
  lib = mkdtempSync(join(tmpdir(), 'verify-lib-'));
  mkdirSync(join(root, 'data', 'entities', 'person'), { recursive: true });
  mkdirSync(join(root, 'data', 'citations', 'wiki'), { recursive: true });
  writeFileSync(join(root, 'data', 'entities', 'person', 'archytas.yaml'), ENTITY);
  writeFileSync(join(root, 'data', 'citations', 'wiki', 'Page.yaml'), CITES);
  mkdirSync(join(lib, 'sources', 'dl'), { recursive: true });
  writeFileSync(join(lib, 'sources', 'dl', 'text.md'), TEXT);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(lib, { recursive: true, force: true });
});

const run = (write: boolean) => checkItems(collectItems(root), openLibrary(lib), write);

describe('openLibrary', () => {
  it('fails clearly without LIBRARY_DIR or a library checkout', () => {
    expect(() => openLibrary()).toThrow(/LIBRARY_DIR is not set/u);
    expect(() => openLibrary(root)).toThrow(/not a library checkout/u);
  });
});

describe('collectItems', () => {
  it('reads claim sources and cites, with claim ids and cite numbers', () => {
    const items = collectItems(root);
    expect(items.map((item) => [item.label, item.key, item.locator])).toEqual([
      ['archytas.member-of.pythagoreans', 'dl', 'DL 8.79'],
      ['archytas.member-of.pythagoreans', 'dl', 'DL 8.79'],
      ['cite 1', 'dl', 'DL 8.80'],
      ['cite 2', 'dl', ''],
    ]);
    expect(items[0]?.passage).toBe('stale');
  });

  it('reads only the folders named', () => {
    expect(collectItems(root, ['citations']).map((item) => item.label)).toEqual([
      'cite 1',
      'cite 2',
    ]);
    expect(collectItems(root, ['entities']).map((item) => item.file)).toEqual([
      'data/entities/person/archytas.yaml',
      'data/entities/person/archytas.yaml',
    ]);
  });
});

describe('quote check', () => {
  it('passes excerpts within their locator, across a soft wrap, and with no locator', () => {
    const { problems } = run(false);
    expect(problems.map((problem) => problem.type)).toEqual(['stale-passage']);
  });

  it('reports a key with no text.md, an unresolved and a malformed locator', () => {
    writeFileSync(
      join(root, 'data', 'citations', 'wiki', 'Page.yaml'),
      `- key: nope
  locator: p. 1
  excerpt: x
- key: dl
  locator: DL 9.9
  excerpt: Other
- key: dl
  locator: '§x'
  excerpt: Other
`,
    );
    expect(run(false).problems.map((problem) => problem.type)).toEqual([
      'stale-passage',
      'no-text',
      'locator-unresolved',
      'bad-locator',
    ]);
  });

  it('reports an excerpt outside its locator and says where it is found instead', () => {
    writeFileSync(
      join(root, 'data', 'citations', 'wiki', 'Page.yaml'),
      `- key: dl
  locator: DL 8.80
  excerpt: generalissimo of his city
- key: dl
  locator: DL 8.80
  excerpt: not in the text at all
`,
    );
    const messages = run(false)
      .problems.filter((problem) => problem.type === 'excerpt-outside-locator')
      .map((problem) => problem.message);
    expect(messages[0]).toContain('found elsewhere, at DL 8.79');
    expect(messages[1]).toContain('not found anywhere');
  });

  it('hashes the paragraphs the excerpt touches', () => {
    const wrap = 'Archytas of Tarentum was another of the Pythagoreans.';
    const both = `${wrap} He was generalissimo of his city seven times.`;
    expect(passageHash([wrap])).not.toBe(passageHash([both]));
    writeFileSync(
      join(root, 'data', 'citations', 'wiki', 'Page.yaml'),
      `- key: dl
  locator: DL 8.79
  excerpt: Pythagoreans. He was generalissimo
`,
    );
    writeEdits(root, run(true).edits);
    const [item] = readItems(
      'x',
      readFileSync(join(root, 'data', 'citations', 'wiki', 'Page.yaml'), 'utf8'),
    );
    expect(item?.passage).toBe(
      passageHash([wrap, 'He was generalissimo of his city seven times.']),
    );
  });
});

describe('--write', () => {
  it('changes only the passage lines and leaves everything else byte-identical', () => {
    const before = readFileSync(join(root, 'data', 'entities', 'person', 'archytas.yaml'), 'utf8');
    const result = run(true);
    expect(result.problems).toEqual([]);
    expect(result.filled).toBe(4);
    writeEdits(root, result.edits);
    const after = readFileSync(join(root, 'data', 'entities', 'person', 'archytas.yaml'), 'utf8');
    const first = passageHash(['Archytas of Tarentum was another of the Pythagoreans.']);
    const second = passageHash(['He was generalissimo of his city seven times.']);
    expect(after.replaceAll(/^\s*passage: .*\n/gmu, '')).toBe(
      before.replaceAll(/^\s*passage: .*\n/gmu, ''),
    );
    expect(after).toContain(`Pythagoreans.'
        passage: ${first}
`);
    expect(after).toContain(`trailing comment
        passage: ${second}
`);
    expect(after.match(/passage: [0-9a-f]{16}\n/gu)).toHaveLength(2);
    expect(after).toContain('# a hand-written comment');
    expect(after).toContain('"generalissimo of his city"   # trailing comment\n        passage: ');
    // A second run finds nothing to do, and a plain check passes.
    expect(run(true).filled).toBe(0);
    expect(run(false).problems).toEqual([]);
  });

  it('keeps CRLF line endings and appends after a last line with no newline', () => {
    const source = '- key: dl\r\n  locator: DL 8.80\r\n  excerpt: Other matter entirely.';
    const items = readItems('f.yaml', source);
    const edit = typeof items[0]?.write === 'function' ? items[0].write('abc') : undefined;
    expect(applyEdits(source, edit ? [edit] : [])).toBe(`${source}\r\n  passage: abc`);
  });

  it('does not write without --write, and a stale hash is a problem then', () => {
    const file = join(root, 'data', 'entities', 'person', 'archytas.yaml');
    run(false);
    expect(readFileSync(file, 'utf8')).toBe(ENTITY);
    expect(run(false).problems[0]?.message).toContain('stale');
  });
});

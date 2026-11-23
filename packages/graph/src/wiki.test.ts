import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import type { Graph } from './load.ts';
import { articleRoutes, readWikiPages, validateWiki } from './wiki.ts';
import { findWikiRefs } from './wikiSyntax.ts';

const graph = {
  entities: new Map([
    ['porphyry', {}],
    ['plotinus', {}],
  ]),
  sources: new Map([
    ['lives', {}],
    ['sep', {}],
  ]),
} as unknown as Graph;

let root: string;

function put(path: string, text: string): void {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const page = (path: string, body: string, front = ''): void =>
  put(`apps/site/src/pages/wiki/${path}.md`, `---\ntitle: T\n${front}---\n\n${body}\n`);
const cites = (path: string, text: string): void => put(`data/citations/${path}.yaml`, text);

function problems(): string[] {
  return validateWiki(graph, {
    pagesDir: join(root, 'apps/site/src/pages'),
    dataDir: join(root, 'data'),
  }).map((p) => `${p.file} ${p.at}: ${p.message}`);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'wiki-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('findWikiRefs', () => {
  it('lists each key and locator once, in order of first use', () => {
    const refs = findWikiRefs(
      'A [@lives, 1] B [@sep] C [@lives, 1] D [@lives,2] [[porphyry]] [[porphyry|him]]',
    );
    expect(refs.cites).toEqual([
      { key: 'lives', locator: '1' },
      { key: 'sep', locator: '' },
      { key: 'lives', locator: '2' },
    ]);
    expect(refs.entities).toEqual(['porphyry']);
  });

  it('ignores code and escaped brackets', () => {
    const body = 'x `[@a]` \\[@b] [[c\n\n```md\n[@d] [[e]]\n```\n\n[@f]';
    expect(findWikiRefs(body).cites).toEqual([{ key: 'f', locator: '' }]);
    expect(findWikiRefs(body).entities).toEqual([]);
  });
});

describe('validateWiki', () => {
  it('passes a page whose cites match its entries', () => {
    page(
      'a/P',
      'Text [@lives, 1] and [[plotinus]] and [@lives, 1] and [@sep].',
      'entity: porphyry\n',
    );
    cites('a/P', '- { key: lives, locator: "1", excerpt: e }\n- { key: sep, excerpt: f }\n');
    expect(problems()).toEqual([]);
  });

  it('reports an unknown source key with the page and cite', () => {
    page('a/P', 'Text [@nope, 3].');
    cites('a/P', '- { key: nope, locator: "3", excerpt: e }\n');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/P.md [@nope, 3]: unknown source key "nope"',
    ]);
  });

  it('reports an unknown entity ID', () => {
    page('a/P', 'See [[nobody]].');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/P.md [[nobody]]: unknown entity ID "nobody"',
    ]);
  });

  it('reports a cite with no entry', () => {
    page('a/P', '[@lives, 1] [@sep]');
    cites('a/P', '- { key: lives, locator: "1", excerpt: e }\n');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/P.md [@sep]: cite 2 has no excerpt entry in data/citations/a/P.yaml',
    ]);
  });

  it('reports an entry with no excerpt through the schema', () => {
    page('a/P', '[@lives, 1]');
    cites('a/P', '- { key: lives, locator: "1", excerpt: "" }\n');
    expect(problems().join('\n')).toContain('data/citations/a/P.yaml 0.excerpt');
  });

  it('reports a stale entry', () => {
    page('a/P', '[@lives, 1]');
    cites('a/P', '- { key: lives, locator: "1", excerpt: e }\n- { key: sep, excerpt: f }\n');
    expect(problems()).toEqual([
      'data/citations/a/P.yaml 1: stale entry sep: apps/site/src/pages/wiki/a/P.md has no such cite',
    ]);
  });

  it('reports an entry that disagrees with the cite at its position', () => {
    page('a/P', '[@lives, 1] [@sep]');
    cites('a/P', '- { key: sep, excerpt: f }\n- { key: lives, locator: "1", excerpt: e }\n');
    expect(problems()).toHaveLength(2);
    expect(problems()[0]).toContain(
      'entry 1 is sep, but apps/site/src/pages/wiki/a/P.md cites lives, 1 there',
    );
  });

  it('reports a page with cites and no citations file', () => {
    page('a/P', '[@lives, 1] [@sep]');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/P.md citations: has 2 cites but data/citations/a/P.yaml does not exist',
    ]);
  });

  it('accepts a page without cites and without a file', () => {
    page('a/P', 'No notes here.');
    expect(problems()).toEqual([]);
  });

  it('reports a citations file with no page', () => {
    cites('a/Gone', '- { key: lives, excerpt: e }\n');
    expect(problems()).toEqual([
      'data/citations/a/Gone.yaml : no wiki page for this citations file',
    ]);
  });

  it('reports two pages claiming one entity', () => {
    page('a/One', 'x', 'entity: porphyry\n');
    page('a/Two', 'y', 'entity: porphyry\n');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/Two.md entity: "porphyry" is already the home article of apps/site/src/pages/wiki/a/One.md',
    ]);
  });

  it('reports a page entity that is not in the graph', () => {
    page('a/P', 'x', 'entity: ghost\n');
    expect(problems()).toEqual([
      'apps/site/src/pages/wiki/a/P.md entity: unknown entity ID "ghost"',
    ]);
  });
});

describe('readWikiPages', () => {
  it('maps entities to routes, an index page to its folder', () => {
    page('a/index', 'x', 'entity: plotinus\n');
    page('a/P', 'y', 'entity: porphyry\n');
    const routes = articleRoutes(readWikiPages(join(root, 'apps/site/src/pages')));
    expect(routes.get('plotinus')).toBe('/wiki/a');
    expect(routes.get('porphyry')).toBe('/wiki/a/P');
  });

  it('reads title, group, order, extra and audited from frontmatter', () => {
    page('a/P', 'x', 'group: People\norder: 30\nextra: true\naudited: 2026-11-09\n');
    page('a/Q', 'y');
    const [p, q] = readWikiPages(join(root, 'apps/site/src/pages'));
    expect(p).toMatchObject({
      title: 'T',
      group: 'People',
      order: 30,
      extra: true,
      audited: '2026-11-09',
    });
    expect(q).toMatchObject({ group: undefined, order: undefined, extra: false });
  });
});

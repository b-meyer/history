import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import type { MapData } from './build/mapData.ts';
import type { EntityRecord } from './build/records.ts';
import { writeOutputs } from './build/write.ts';
import { loadGraph } from './load.ts';
import { shardOf } from './shard.ts';
import { validateGraph } from './validate.ts';

// The repo's own vocabulary, so the tests check the predicates the data will use.
const VOCAB = resolve(import.meta.dirname, '../../../data/vocab');
const TODAY = '2026-11-19';

let root: string;
let data: string;

function write(path: string, text: string): void {
  const file = join(data, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function claim(id: string, fields: string): string {
  return `  - id: ${id}
${fields
  .trim()
  .split('\n')
  .map((line) => `    ${line.trim()}`)
  .join('\n')}
    confidence: A
    basis: primary
    origin: human
    reviewed: 2026-11-02
    sources:
      - key: porphyry-life-of-plotinus
        locator: VP 4–5
        stance: asserts
        excerpt: words the claim needs
`;
}

function seed(): void {
  write(
    'sources/porphyry-life-of-plotinus.yaml',
    'key: porphyry-life-of-plotinus\nkind: primary\ntitle: Life of Plotinus\nauthors: [Porphyry]\nwritten: 0301~\n',
  );
  write(
    'entities/place/rome.yaml',
    'id: rome\ntype: place\nnames: { en: Rome }\ncoords: [12.48, 41.89]\n',
  );
  write(
    'entities/person/plotinus.yaml',
    `id: plotinus\ntype: person\nnames: { en: Plotinus }\nnotability: 9\nclaims:\n${claim('plotinus.born', 'predicate: born\nwhen: 0204/0205')}`,
  );
  write(
    'entities/person/porphyry.yaml',
    `id: porphyry\ntype: person\nnames: { en: Porphyry, grc: Πορφύριος }\nclaims:\n${claim('porphyry.student-of.plotinus', 'predicate: student-of\nobject: plotinus\nwhen: 0263/0268\nwhere: rome')}${claim('porphyry.active-at.rome', 'predicate: active-at\nobject: rome\nwhen: 0263/0268')}`,
  );
}

function problems(): string[] {
  const { graph, problems: loadProblems } = loadGraph(data);
  return [...loadProblems, ...validateGraph(graph, { today: TODAY })].map(
    ({ file, at, message }) => `${file} ${at}: ${message}`,
  );
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'graph-'));
  data = join(root, 'data');
  cpSync(VOCAB, join(data, 'vocab'), { recursive: true });
  seed();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('the repo vocabulary', () => {
  it('loads and validates with no problems', () => {
    expect(problems()).toEqual([]);
  });
});

describe('loadGraph', () => {
  it('reads EDTF years as strings, not numbers', () => {
    write(
      'entities/person/pythagoras.yaml',
      `id: pythagoras\ntype: person\nnames: { en: Pythagoras }\nclaims:\n${claim('pythagoras.born', 'predicate: born\nwhen: -0569')}`,
    );
    const { graph } = loadGraph(data);
    expect(graph.entities.get('pythagoras')?.claims[0]?.when).toBe('-0569');
  });

  it('reports schema problems with their file and field', () => {
    write(
      'entities/person/bad.yaml',
      'id: bad\ntype: person\nnames: { en: Bad }\nclaims:\n  - id: bad.born\n    predicate: born\n    when: 570 BCE\n    confidence: D\n    basis: primary\n    origin: human\n    reviewed: 2026-11-02\n    sources: []\n',
    );
    const found = problems();
    expect(found).toContainEqual(
      expect.stringContaining('data/entities/person/bad.yaml claims.0.when: must be an EDTF date'),
    );
    expect(found).toContainEqual(expect.stringContaining('claims.0.confidence'));
    expect(found).toContainEqual(
      expect.stringContaining('claims.0.sources: a claim needs at least one source'),
    );
  });

  it('rejects a claim with no reviewed date', () => {
    write(
      'entities/person/unreviewed.yaml',
      'id: unreviewed\ntype: person\nnames: { en: X }\nclaims:\n  - id: unreviewed.born\n    predicate: born\n    when: "0300"\n    confidence: A\n    basis: primary\n    origin: import\n    sources:\n      - { key: porphyry-life-of-plotinus, locator: "1", stance: asserts, excerpt: x }\n',
    );
    expect(problems()).toContainEqual(expect.stringContaining('unreviewed.yaml claims.0.reviewed'));
  });

  it('checks file names, folders and duplicate IDs', () => {
    write('entities/person/wrong-name.yaml', 'id: someone\ntype: person\nnames: { en: X }\n');
    write('entities/work/plotinus.yaml', 'id: plotinus\ntype: work\nnames: { en: X }\n');
    write('entities/people/x.yaml', 'id: x\ntype: person\nnames: { en: X }\n');
    const found = problems();
    expect(found).toContainEqual(
      expect.stringContaining("id 'someone' does not match the file name 'wrong-name'"),
    );
    expect(found).toContainEqual(
      expect.stringContaining(
        "id 'plotinus' is already used by data/entities/person/plotinus.yaml",
      ),
    );
    expect(found).toContainEqual(expect.stringContaining('unknown entity type folder'));
  });
});

describe('validateGraph', () => {
  it('checks predicates, objects, places and sources', () => {
    write(
      'entities/person/proclus.yaml',
      `id: proclus\ntype: person\nnames: { en: Proclus }\nclaims:\n${claim('proclus.student-of.nobody', 'predicate: student-of\nobject: nobody')}${claim('proclus.student-of.rome', 'predicate: student-of\nobject: rome')}${claim('proclus.teacher-of.x', 'predicate: teacher-of\nobject: plotinus')}${claim('proclus.born', 'predicate: born')}${claim('proclus.died', 'predicate: died\nwhen: "0485"\nwhere: plotinus')}${claim('wrong.prefix', 'predicate: floruit\nwhen: "0450"')}`,
    );
    const found = problems();
    expect(found).toContainEqual(expect.stringContaining("unknown entity 'nobody'"));
    expect(found).toContainEqual(
      expect.stringContaining("'student-of' points at person, not a place"),
    );
    expect(found).toContainEqual(expect.stringContaining("unknown predicate 'teacher-of'"));
    expect(found).toContainEqual(expect.stringContaining("'born' needs a when"));
    expect(found).toContainEqual(expect.stringContaining("'plotinus' is a person, not a place"));
    expect(found).toContainEqual(expect.stringContaining("claim ID must start with 'proclus.'"));
  });

  it('requires a scholarly basis for influence', () => {
    write(
      'entities/person/iamblichus.yaml',
      `id: iamblichus\ntype: person\nnames: { en: Iamblichus }\nclaims:\n${claim('iamblichus.influenced-by.plotinus', 'predicate: influenced-by\nobject: plotinus')}`,
    );
    expect(problems()).toContainEqual(
      expect.stringContaining("'influenced-by' needs basis scholarly, not primary"),
    );
  });

  it('rejects a reviewed date in the future and an unknown source', () => {
    write(
      'entities/person/x.yaml',
      'id: x\ntype: person\nnames: { en: X }\nclaims:\n  - id: x.born\n    predicate: born\n    when: "0300"\n    confidence: A\n    basis: primary\n    origin: human\n    reviewed: 2027-01-01\n    sources:\n      - { key: missing-source, locator: "1", stance: asserts, excerpt: x }\n',
    );
    const found = problems();
    expect(found).toContainEqual(
      expect.stringContaining('reviewed date 2027-01-01 is in the future'),
    );
    expect(found).toContainEqual(expect.stringContaining("unknown source 'missing-source'"));
  });

  it('requires coords on places only', () => {
    write('entities/place/athens.yaml', 'id: athens\ntype: place\nnames: { en: Athens }\n');
    expect(problems()).toContainEqual(expect.stringContaining('a place needs coords'));
  });

  it('keeps type-specific fields on their type', () => {
    write(
      'entities/work/golden-verses.yaml',
      'id: golden-verses\ntype: work\nnames: { en: Golden Verses }\nlanguage: grc\nstatus: extant\n',
    );
    write(
      'entities/person/x.yaml',
      'id: x\ntype: person\nnames: { en: X }\nstatus: lost\nfamily: Abrahamic\n',
    );
    const found = problems();
    expect(found).not.toContainEqual(expect.stringContaining('golden-verses.yaml'));
    expect(found).toContainEqual(expect.stringContaining('x.yaml status: only a work has status'));
    expect(found).toContainEqual(
      expect.stringContaining('x.yaml family: only a tradition has family'),
    );
  });

  it('rejects a claim that points at its own entity', () => {
    write(
      'entities/person/x.yaml',
      `id: x\ntype: person\nnames: { en: X }\nclaims:\n${claim('x.student-of.x', 'predicate: student-of\nobject: x')}`,
    );
    expect(problems()).toContainEqual(
      expect.stringContaining('a claim cannot point at its own entity'),
    );
  });
});

describe('writeOutputs', () => {
  it('writes map data, record IDs and sharded records with derived inverse links', () => {
    const out = join(root, 'out');
    const summary = writeOutputs(loadGraph(data).graph, out);
    expect(summary.entities).toBe(3);

    expect(JSON.parse(readFileSync(join(out, 'record-ids.json'), 'utf8'))).toEqual([
      'plotinus',
      'porphyry',
      'rome',
    ]);

    const shard = JSON.parse(
      readFileSync(join(out, 'records', `${shardOf('plotinus')}.json`), 'utf8'),
    ) as Record<string, EntityRecord>;
    const plotinus = shard.plotinus;
    expect(plotinus?.span).toEqual({ start: 204, end: 205 });
    const taught = plotinus?.claims.find((c) => c.derived);
    expect(taught).toMatchObject({
      id: 'porphyry.student-of.plotinus',
      predicate: 'teacher-of',
      label: 'teacher of',
      other: { id: 'porphyry', name: 'Porphyry' },
      whenText: '263–268 CE',
      where: { id: 'rome' },
    });
    expect(plotinus?.sources['porphyry-life-of-plotinus']).toMatchObject({
      title: 'Life of Plotinus',
      writtenText: 'c. 301 CE',
    });

    const map = JSON.parse(readFileSync(join(out, 'map.json'), 'utf8')) as MapData;
    expect(map.places.rome).toEqual({ name: 'Rome', coords: [12.48, 41.89] });
    expect(map.claims.find((c) => c.id === 'porphyry.active-at.rome')).toMatchObject({
      place: 'rome',
      start: 263,
      end: 268,
      confidence: 'A',
    });
    expect(map.entities.find((e) => e.id === 'plotinus')).toMatchObject({
      notability: 9,
      start: 204,
      end: 205,
    });
  });

  it('replaces records from an earlier build', () => {
    const out = join(root, 'out');
    mkdirSync(join(out, 'records'), { recursive: true });
    writeFileSync(join(out, 'records', 'stale.json'), '{}');
    writeOutputs(loadGraph(data).graph, out);
    expect(existsSync(join(out, 'records', 'stale.json'))).toBe(false);
  });
});

describe('shardOf', () => {
  it('is stable and two hex digits', () => {
    expect(shardOf('porphyry')).toMatch(/^[0-9a-f]{2}$/u);
    expect(shardOf('porphyry')).toBe(shardOf('porphyry'));
  });
});

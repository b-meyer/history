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
import { buildMapData, type MapData } from './build/mapData.ts';
import { writeOutputs, type VocabTerms } from './build/write.ts';
import type { EntityRecord, ReadingEntry, RecordSearchEntry } from './index.ts';
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
    audits:
      - { on: 2026-11-02, by: claude-opus-5-5, verdict: confirmed }
      - { on: 2026-11-03, by: claude-sonnet-5-5, verdict: confirmed }
    sources:
      - key: porphyry-life-of-plotinus
        locator: VP 4–5
        stance: asserts
        excerpt: words the claim needs
`;
}

/** One person, x, with a single born claim carrying these audits and source stances. */
function audited(
  audits: string[],
  options: { confidence?: string; stances?: string[] } = {},
): void {
  const sources = (options.stances ?? ['asserts'])
    .map(
      (stance, index) =>
        `      - { key: ${index === 0 ? 'porphyry-life-of-plotinus' : 'other-source'}, locator: "1", stance: ${stance}, excerpt: x }\n`,
    )
    .join('');
  const list =
    audits.length === 0
      ? '    audits: []\n'
      : `    audits:\n${audits.map((audit) => `      - { ${audit} }\n`).join('')}`;
  write(
    'entities/person/x.yaml',
    `id: x\ntype: person\nnames: { en: X }\nclaims:\n  - id: x.born\n    predicate: born\n    when: "0300"\n    confidence: ${options.confidence ?? 'B'}\n    basis: primary\n    origin: ai-extracted\n${list}    sources:\n${sources}`,
  );
}

function seed(): void {
  write('sources/other-source.yaml', 'key: other-source\nkind: secondary\ntitle: Other\n');
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

  it('accepts only http and https source URLs', () => {
    write(
      'sources/bad-url.yaml',
      'key: bad-url\nkind: secondary\ntitle: T\nurl: javascript:alert(1)\n',
    );
    write(
      'sources/good-url.yaml',
      'key: good-url\nkind: secondary\ntitle: T\nurl: https://example.org/t\n',
    );
    const found = problems();
    expect(found).toContainEqual(expect.stringMatching(/bad-url\.yaml.*http or https/u));
    expect(found.filter((p) => p.includes('good-url'))).toEqual([]);
  });

  it('reports schema problems with their file and field', () => {
    write(
      'entities/person/bad.yaml',
      'id: bad\ntype: person\nnames: { en: Bad }\nclaims:\n  - id: bad.born\n    predicate: born\n    when: 570 BCE\n    confidence: D\n    basis: primary\n    origin: human\n    audits: []\n    sources: []\n',
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

  it('rejects an unknown claim source', () => {
    write(
      'entities/person/x.yaml',
      'id: x\ntype: person\nnames: { en: X }\nclaims:\n  - id: x.born\n    predicate: born\n    when: "0300"\n    confidence: A\n    basis: primary\n    origin: human\n    audits:\n      - { on: 2026-11-02, by: human, verdict: confirmed }\n    sources:\n      - { key: missing-source, locator: "1", stance: asserts, excerpt: x }\n',
    );
    expect(problems()).toContainEqual(expect.stringContaining("unknown source 'missing-source'"));
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

  it('writes the confidence and basis wording to vocab.json', () => {
    const out = join(root, 'out');
    writeOutputs(loadGraph(data).graph, out);
    const vocab = JSON.parse(readFileSync(join(out, 'vocab.json'), 'utf8')) as VocabTerms;
    expect(Object.keys(vocab.confidence)).toEqual(['A', 'B', 'C']);
    expect(vocab.confidence.C.label).toBe('Contested');
    expect(Object.keys(vocab.basis)).toEqual(['primary', 'scholarly', 'tradition']);
    expect(vocab.basis.tradition.meaning).toMatch(/\S/u);
  });

  it('writes one search entry per record with other names, span and places', () => {
    const out = join(root, 'out');
    writeOutputs(loadGraph(data).graph, out);
    const entries = JSON.parse(
      readFileSync(join(out, 'search-records.json'), 'utf8'),
    ) as RecordSearchEntry[];
    expect(entries.map((e) => e.entity)).toEqual(['plotinus', 'porphyry', 'rome']);
    expect(entries.find((e) => e.entity === 'porphyry')).toEqual({
      slug: 'e/porphyry',
      pageTitle: 'Person',
      heading: 'Porphyry',
      headingId: '',
      level: 1,
      body: 'Πορφύριος · 263–268 CE · Rome',
      entity: 'porphyry',
      origin: 'record',
    });
    expect(entries.find((e) => e.entity === 'plotinus')?.body).toBe('204–205 CE · Rome');
  });

  it('writes only flagged sources to reading.json, with the records that cite them', () => {
    write(
      'sources/porphyry-life-of-plotinus.yaml',
      'key: porphyry-life-of-plotinus\nkind: primary\ntitle: Life of Plotinus\nauthors: [Porphyry]\nwritten: 0301~\nreadingList: true\nannotation: Start here.\n',
    );
    const out = join(root, 'out');
    writeOutputs(loadGraph(data).graph, out);
    const reading = JSON.parse(readFileSync(join(out, 'reading.json'), 'utf8')) as ReadingEntry[];
    expect(reading).toHaveLength(1);
    expect(reading[0]).toMatchObject({
      key: 'porphyry-life-of-plotinus',
      kind: 'primary',
      annotation: 'Start here.',
      writtenText: 'c. 301 CE',
      records: [
        { id: 'plotinus', name: 'Plotinus' },
        { id: 'porphyry', name: 'Porphyry' },
        { id: 'rome', type: 'place', name: 'Rome' },
      ],
    });
    expect(reading[0]).not.toHaveProperty('readingList');

    const shard = JSON.parse(
      readFileSync(join(out, 'records', `${shardOf('plotinus')}.json`), 'utf8'),
    ) as Record<string, EntityRecord>;
    expect(shard.plotinus?.sources['porphyry-life-of-plotinus']).toMatchObject({
      readingList: true,
      annotation: 'Start here.',
    });
  });

  it('writes an empty reading.json when no source is flagged', () => {
    const out = join(root, 'out');
    writeOutputs(loadGraph(data).graph, out);
    expect(JSON.parse(readFileSync(join(out, 'reading.json'), 'utf8'))).toEqual([]);
  });

  it('replaces records from an earlier build', () => {
    const out = join(root, 'out');
    mkdirSync(join(out, 'records'), { recursive: true });
    writeFileSync(join(out, 'records', 'stale.json'), '{}');
    writeOutputs(loadGraph(data).graph, out);
    expect(existsSync(join(out, 'records', 'stale.json'))).toBe(false);
  });
});

function mapData(): MapData {
  return buildMapData(loadGraph(data).graph);
}

describe('buildMapData', () => {
  it('puts an entity at the place an active-at claim names', () => {
    expect(mapData().stays.find((s) => s.claim === 'porphyry.active-at.rome')).toMatchObject({
      entity: 'porphyry',
      type: 'person',
      name: 'Porphyry',
      place: 'rome',
      coords: [12.48, 41.89],
      start: 263,
      end: 268,
      confidence: 'A',
      basis: 'primary',
    });
  });

  it('places a born claim by its where, using one date bound for both ends', () => {
    write(
      'entities/person/plotinus.yaml',
      `id: plotinus\ntype: person\nnames: { en: Plotinus }\nnotability: 9\nclaims:\n${claim('plotinus.born', 'predicate: born\nwhen: 0204/\nwhere: rome')}`,
    );
    expect(mapData().stays.find((s) => s.claim === 'plotinus.born')).toMatchObject({
      entity: 'plotinus',
      notability: 9,
      start: 204,
      end: 204,
    });
  });

  it('draws a student-of link from the teacher to the student', () => {
    write(
      'entities/place/lycopolis.yaml',
      'id: lycopolis\ntype: place\nnames: { en: Lycopolis }\ncoords: [31.18, 27.18]\n',
    );
    write(
      'entities/person/plotinus.yaml',
      `id: plotinus\ntype: person\nnames: { en: Plotinus }\nclaims:\n${claim('plotinus.born', 'predicate: born\nwhen: 0204/0205\nwhere: lycopolis')}${claim('plotinus.active-at.rome', 'predicate: active-at\nobject: rome\nwhen: 0244/0270')}`,
    );
    expect(mapData().links).toEqual([
      expect.objectContaining({
        claim: 'porphyry.student-of.plotinus',
        label: 'student of',
        subject: 'porphyry',
        object: 'plotinus',
        // Plotinus's stay at Rome overlaps 263–268; his birthplace does not.
        from: [12.48, 41.89],
        to: [12.48, 41.89],
        start: 263,
        end: 268,
      }),
    ]);
  });

  it('dates an undated link by the later entity, so it draws when that one is active', () => {
    write(
      'entities/place/athens.yaml',
      'id: athens\ntype: place\nnames: { en: Athens }\ncoords: [23.73, 37.98]\n',
    );
    write(
      'entities/person/proclus.yaml',
      `id: proclus\ntype: person\nnames: { en: Proclus }\nclaims:\n${claim('proclus.active-at.athens', 'predicate: active-at\nobject: athens\nwhen: 0430/0485')}`,
    );
    write(
      'entities/person/plotinus.yaml',
      `id: plotinus\ntype: person\nnames: { en: Plotinus }\nclaims:\n${claim('plotinus.active-at.rome', 'predicate: active-at\nobject: rome\nwhen: 0244/0270')}`,
    );
    write(
      'entities/person/marinus.yaml',
      `id: marinus\ntype: person\nnames: { en: Marinus }\nclaims:\n${claim('marinus.student-of.proclus', 'predicate: student-of\nobject: proclus')}${claim('marinus.active-at.athens', 'predicate: active-at\nobject: athens\nwhen: 0470/0500')}`,
    );
    const link = mapData().links.find((l) => l.claim === 'marinus.student-of.proclus');
    expect(link).toMatchObject({ start: 470, end: 500, from: [23.73, 37.98] });
  });

  it('skips a link when one end has no place', () => {
    write(
      'entities/person/amelius.yaml',
      `id: amelius\ntype: person\nnames: { en: Amelius }\nclaims:\n${claim('amelius.student-of.plotinus', 'predicate: student-of\nobject: plotinus\nwhen: 0246/0269')}`,
    );
    // Plotinus has a born claim but no place, so neither link can be drawn.
    const links = mapData().links;
    expect(links.find((l) => l.claim === 'amelius.student-of.plotinus')).toBeUndefined();
    expect(links.find((l) => l.claim === 'porphyry.student-of.plotinus')).toBeUndefined();
  });
});

describe('shardOf', () => {
  it('is stable and two hex digits', () => {
    expect(shardOf('porphyry')).toMatch(/^[0-9a-f]{2}$/u);
    expect(shardOf('porphyry')).toBe(shardOf('porphyry'));
  });
});

const OPUS = 'on: 2026-11-02, by: claude-opus-5-5, verdict: confirmed';
const SONNET = 'on: 2026-11-03, by: claude-sonnet-5-5, verdict: confirmed';

/** Problems in the x.yaml fixture that audited() writes. */
function auditProblems(): string[] {
  return problems().filter((p) => p.includes('x.yaml'));
}

describe('audits', () => {
  it('passes two confirmations by different auditors', () => {
    audited([OPUS, SONNET]);
    expect(auditProblems()).toEqual([]);
  });

  it('fails a claim with no audits', () => {
    audited([]);
    expect(auditProblems()).toContainEqual(
      expect.stringContaining('claims.0.audits: needs two independent passing audits (has 0)'),
    );
  });

  it('fails two passes by the same auditor', () => {
    audited([OPUS, 'on: 2026-11-04, by: claude-opus-5-5, verdict: changed']);
    expect(auditProblems()).toContainEqual(
      expect.stringContaining('needs two independent passing audits (has 1)'),
    );
  });

  it('passes the same auditor when one audit checked a different source', () => {
    audited([
      OPUS,
      'on: 2026-11-04, by: claude-opus-5-5, verdict: confirmed, source: other-source',
    ]);
    expect(auditProblems()).toEqual([]);
  });

  it('passes a single human audit', () => {
    audited(['on: 2026-11-02, by: human, verdict: confirmed']);
    expect(auditProblems()).toEqual([]);
  });

  it('fails when the latest audit is flagged, even after two passes', () => {
    audited([
      OPUS,
      SONNET,
      'on: 2026-11-05, by: claude-opus-5-5, verdict: flagged, note: wrong year',
    ]);
    expect(auditProblems()).toContainEqual(
      expect.stringContaining('claims.0.audits: the latest audit flagged this claim'),
    );
  });

  it('rejects an audit dated in the future or citing an unknown source', () => {
    audited([
      OPUS,
      SONNET,
      'on: 2027-01-01, by: claude-sonnet-5-5, verdict: confirmed, source: nowhere',
    ]);
    const found = auditProblems();
    expect(found).toContainEqual(
      expect.stringContaining('claims.0.audits.2.on: audit date 2027-01-01 is in the future'),
    );
    expect(found).toContainEqual(
      expect.stringContaining("claims.0.audits.2.source: unknown source 'nowhere'"),
    );
  });

  it('rejects confidence A resting only on reports', () => {
    audited([OPUS, SONNET], { confidence: 'A', stances: ['reports', 'reports'] });
    expect(auditProblems()).toContainEqual(
      expect.stringContaining('claims.0.confidence: confidence A needs a source that asserts'),
    );
  });

  it('rejects confidence A with a disputing source', () => {
    audited([OPUS, SONNET], { confidence: 'A', stances: ['asserts', 'disputes'] });
    expect(auditProblems()).toContainEqual(
      expect.stringContaining(
        'claims.0.confidence: confidence A cannot rest on a claim a source disputes',
      ),
    );
  });
});

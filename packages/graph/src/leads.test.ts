import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { findLeadFiles } from './leadGuard.ts';
import { buildLeadMapData, leadNotability, parseLead, readLeads } from './leads.ts';
import type { Vocab } from './schema/vocab.ts';

const term = { label: 'x', meaning: '' };
const VOCAB: Vocab = {
  predicates: {},
  confidence: { A: term, B: term, C: term },
  basis: { primary: term, scholarly: term, tradition: term },
};

const PORPHYRY = `qid: Q1
retrieved: 2026-11-19
label: Porphyry
type: person
sitelinks: 70
dates:
  born: ['0234~']
  died: ['0305']
places:
  born-in:
    - { qid: Q100, label: Tyre, coords: ['35.2', '33.27'] }
  died-in:
    - { qid: Q220, label: Rome, coords: ['12.48', '41.89'] }
links:
  student-of:
    - { qid: Q2, label: Plotinus }
`;

const PLOTINUS = `qid: Q2
retrieved: 2026-11-19
label: Plotinus
type: person
dates:
  died: ['0270']
places:
  died-in:
    - { qid: Q220, label: Rome, coords: ['12.48', '41.89'] }
`;

describe('parseLead', () => {
  it('reads a lead and skips one the map cannot type', () => {
    expect(parseLead(PORPHYRY)?.places['born-in']?.[0]?.coords).toEqual([35.2, 33.27]);
    expect(parseLead('qid: Q3\nlabel: Maitreya\ntype: unknown\n')).toBeNull();
  });
});

describe('leadNotability', () => {
  it('grows with sitelinks and stops at 10', () => {
    expect(leadNotability(0)).toBe(0);
    expect(leadNotability(278)).toBe(8);
    expect(leadNotability(5000)).toBe(10);
  });
});

describe('buildLeadMapData', () => {
  const leads = [parseLead(PORPHYRY), parseLead(PLOTINUS)].filter((lead) => lead !== null);
  const map = buildLeadMapData(leads, VOCAB);

  it('draws a stay per dated place and flags every item as a lead', () => {
    expect(map.stays.map((stay) => [stay.entity, stay.place, stay.start])).toEqual([
      ['wd-q1', 'wd-q100', 234],
      ['wd-q1', 'wd-q220', 305],
      ['wd-q2', 'wd-q220', 270],
    ]);
    expect(map.stays.every((stay) => stay.lead === true)).toBe(true);
  });

  it('draws links between leads through the same transform', () => {
    expect(map.links).toHaveLength(1);
    expect(map.links[0]).toMatchObject({ subject: 'wd-q1', object: 'wd-q2', lead: true });
  });
});

describe('readLeads and findLeadFiles', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'graph-leads-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads lead files from LIBRARY_DIR/leads/wikidata', () => {
    mkdirSync(join(dir, 'leads', 'wikidata'), { recursive: true });
    writeFileSync(join(dir, 'leads', 'wikidata', 'Q1.yaml'), PORPHYRY);
    writeFileSync(join(dir, 'leads', 'wikidata', 'notes.txt'), 'not a lead');
    expect(readLeads(dir).map((lead) => lead.qid)).toEqual(['Q1']);
  });

  it('finds lead data by name or by flag, and nothing in graph output', () => {
    mkdirSync(join(dir, 'records'));
    writeFileSync(join(dir, 'map.json'), JSON.stringify(buildLeadMapData([], VOCAB)));
    writeFileSync(join(dir, 'records', '0.json'), '{"id":"porphyry"}');
    expect(findLeadFiles(dir)).toEqual([]);

    const leads = [parseLead(PORPHYRY)].filter((lead) => lead !== null);
    writeFileSync(join(dir, 'records', '1.json'), JSON.stringify(buildLeadMapData(leads, VOCAB)));
    writeFileSync(join(dir, 'leads.json'), '[]');
    expect(findLeadFiles(dir).toSorted()).toEqual(['leads.json', 'records/1.json']);
  });
});

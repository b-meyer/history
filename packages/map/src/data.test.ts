import type { MapLink, MapStay } from 'graph';
import { describe, expect, it } from 'vite-plus/test';
import { labelData, stayAt, visibleLinks, visibleStays } from './data.ts';
import { DEFAULT_LAYERS } from './url.ts';

function stay(fields: Partial<MapStay>): MapStay {
  return {
    entity: 'porphyry',
    type: 'person',
    name: 'Porphyry',
    notability: 5,
    claim: 'porphyry.active-at.rome',
    place: 'rome',
    coords: [12.48, 41.89],
    start: 263,
    end: 268,
    approximate: false,
    confidence: 'A',
    basis: 'primary',
    ...fields,
  };
}

function link(fields: Partial<MapLink>): MapLink {
  return {
    claim: 'porphyry.student-of.plotinus',
    predicate: 'student-of',
    label: 'student of',
    subject: 'porphyry',
    object: 'plotinus',
    from: [12.48, 41.89],
    to: [12.48, 41.89],
    start: 263,
    end: 268,
    confidence: 'A',
    basis: 'primary',
    ...fields,
  };
}

describe('visibleStays', () => {
  const stays = [
    stay({}),
    stay({ type: 'work', claim: 'w' }),
    stay({ type: 'event', claim: 'e' }),
    stay({ confidence: 'C', claim: 'c' }),
    stay({ basis: 'tradition', claim: 't' }),
  ];

  it('keeps everything but events by default', () => {
    expect(visibleStays(stays, DEFAULT_LAYERS).map((s) => s.claim)).toEqual([
      'porphyry.active-at.rome',
      'w',
      'c',
      't',
    ]);
  });

  it('drops contested and tradition claims when their toggles are off', () => {
    expect(visibleStays(stays, ['people', 'works']).map((s) => s.claim)).toEqual([
      'porphyry.active-at.rome',
      'w',
    ]);
  });
});

describe('visibleLinks', () => {
  it('needs the links layer and honours the claim toggles', () => {
    const links = [link({}), link({ confidence: 'C', claim: 'c' })];
    expect(visibleLinks(links, ['people'])).toEqual([]);
    expect(visibleLinks(links, ['links']).map((l) => l.claim)).toEqual([
      'porphyry.student-of.plotinus',
    ]);
    expect(visibleLinks(links, DEFAULT_LAYERS)).toHaveLength(2);
  });
});

describe('stayAt', () => {
  const stays = [
    stay({ claim: 'early', start: 234, end: 234, place: 'tyre' }),
    stay({ claim: 'rome', start: 263, end: 268 }),
    stay({ claim: 'sicily', start: 268, end: 270 }),
    stay({ entity: 'plotinus', claim: 'other' }),
  ];

  it('picks the stay covering t, else the nearest by year', () => {
    expect(stayAt(stays, 'porphyry', 265)?.claim).toBe('rome');
    expect(stayAt(stays, 'porphyry', 200)?.claim).toBe('early');
    expect(stayAt(stays, 'porphyry', 300)?.claim).toBe('sicily');
    expect(stayAt(stays, 'nobody', 265)).toBeUndefined();
  });
});

describe('labelData', () => {
  it('merges stays of one entity at one place into a label', () => {
    const labels = labelData([
      stay({ claim: 'a', start: 263, end: 268 }),
      stay({ claim: 'b', start: 255, end: 265 }),
      stay({ claim: 'c', place: 'sicily', coords: [14, 37.5], start: 268, end: 270 }),
    ]);
    expect(labels).toEqual([
      expect.objectContaining({ entity: 'porphyry', coords: [12.48, 41.89], start: 255, end: 268 }),
      expect.objectContaining({ entity: 'porphyry', coords: [14, 37.5], start: 268, end: 270 }),
    ]);
  });
});

import { describe, expect, it } from 'vite-plus/test';
import { findOverlaps, pageTokens, sourceGrams } from './overlap.ts';

const SOURCE = `---
key: s
original: s.html
extractor: html
---

Archytas of Tarentum was the son of Mnesagoras and a friend of Plato, who wrote to him often.

Short paragraph.
`;

const grams = sourceGrams(SOURCE);
const RUN = 'Archytas of Tarentum was the son of Mnesagoras and a friend of Plato';

const find = (page: string) => findOverlaps('p.md', page, grams);

describe('pageTokens', () => {
  it('marks quoted words, blockquotes and skips furniture', () => {
    const md =
      '---\ntitle: x\n---\n\n# Heading words\n\nplain "quoted words" and “curly” end [@k, 3] <!-- c -->\n\n> block line\n';
    const tokens = pageTokens(md).map((token) => `${token.word}${token.quoted ? '*' : ''}`);
    expect(tokens).toEqual([
      'plain',
      'quoted*',
      'words*',
      'and',
      'curly*',
      'end',
      'block*',
      'line*',
    ]);
  });
});

describe('findOverlaps', () => {
  it('flags 12 or more unquoted words that a cited source holds, ignoring case and punctuation', () => {
    const problems = find(`Intro.\n\nSo: ${RUN.toUpperCase()}, indeed.\n`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ type: 'overlap', where: 'p.md:3' });
    expect(problems[0]?.message).toContain('archytas of tarentum was the');
  });

  it('passes the same words inside straight or curly quotes or a blockquote', () => {
    expect(find(`He wrote "${RUN}" there.\n`)).toEqual([]);
    expect(find(`He wrote “${RUN}” there.\n`)).toEqual([]);
    expect(find(`> ${RUN}\n`)).toEqual([]);
  });

  it('passes eleven matching words, and a match broken by a quote', () => {
    expect(find('Archytas of Tarentum was the son of Mnesagoras and a friend.\n')).toEqual([]);
    expect(
      find('Archytas of Tarentum was the "son" of Mnesagoras and a friend of Plato\n'),
    ).toEqual([]);
  });

  it('reports one stretch for a long match, and does not span paragraphs', () => {
    expect(find(`${RUN} who wrote to him often.\n`)).toHaveLength(1);
    expect(
      find('Archytas of Tarentum was the son of\n\nMnesagoras and a friend of Plato\n'),
    ).toEqual([]);
  });
});

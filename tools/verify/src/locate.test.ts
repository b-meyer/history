import { describe, expect, it } from 'vite-plus/test';
import { LocatorError, locate, locateParagraphs, paragraphLabels } from './locate.ts';

// Ported from the library's tools/passages.test.ts (describe 'locate'); keep in step.

describe('locate', () => {
  const MD = `---
key: k
original: a.html, b.html
extractor: html
---

Front matter prose.

# 1. Life

Life text.

## 1.1 Birth

Born in Tarentum.

## 1.10 Later

Later years.

# 2. Works

<!-- page 12 -->

Page twelve starts and
the sentence runs on

<!-- page 13 -->

to page thirteen.

<!-- ref a -->

<!-- ref DL 8.1 -->

First ref text.

<!-- page 14 -->

Still first ref.

<!-- ref DL 8.2 -->

Second ref text.

<!-- ref DL 8.3 -->

Third ref text.

<!-- ref DL 8.4 -->

Fourth ref text.
`;

  it('resolves preamble to text above any numbered heading or marker', () => {
    expect(locate(MD, 'preamble')).toEqual(['Front matter prose.']);
  });

  it('includes subsections in a section but not look-alike numbers', () => {
    expect(locate(MD, '§1')).toEqual(['Life text. Born in Tarentum. Later years.']);
    expect(locate(MD, '§1.1')).toEqual(['Born in Tarentum.']);
    expect(locate(MD, '§1.10')).toEqual(['Later years.']);
  });

  it('ends a page at the next page marker and joins a range', () => {
    expect(locate(MD, 'p. 12')).toEqual(['Page twelve starts and the sentence runs on']);
    expect(locate(MD, 'p. 13')).toEqual(['to page thirteen.']);
    expect(locate(MD, 'p. 12-13')).toEqual([
      'Page twelve starts and the sentence runs on to page thirteen.',
    ]);
    expect(locate(MD, 'pp. 12–13')).toHaveLength(1);
    expect(locate(MD, 'p. 99')).toEqual([]);
  });

  it('spans a ref to the next ref marker, across pages and headings', () => {
    expect(locate(MD, 'DL 8.1')).toEqual(['First ref text. Still first ref.']);
    expect(locate(MD, 'DL 8.1-8.3')).toEqual([
      'First ref text. Still first ref. Second ref text. Third ref text.',
    ]);
    expect(locate(MD, 'DL 9.9')).toEqual([]);
  });

  it('resolves a chapter heading', () => {
    expect(locate('# CHAPTER IV.\n\nBody.\n\n# V.\n\nOther.\n', 'ch. IV')).toEqual(['Body.']);
  });

  it('throws on a malformed locator', () => {
    expect(() => locate(MD, '§x')).toThrow(LocatorError);
    expect(() => locate(MD, 'p. ')).toThrow(LocatorError);
    expect(() => locate(MD, 'p. 13-12')).toThrow(LocatorError);
    expect(() => locate(MD, 'ch. ')).toThrow(LocatorError);
    expect(() => locate(MD, '')).toThrow(LocatorError);
  });
});

describe('locateParagraphs and paragraphLabels', () => {
  const MD = '# 1. A\n\nOne.\n\n<!-- ref DL 1.1 -->\n\nTwo.\n\nThree.\n';
  it('returns the paragraphs of each span', () => {
    expect(locateParagraphs(MD, 'DL 1.1')).toEqual([['Two.', 'Three.']]);
  });
  it('labels each paragraph with the index locator', () => {
    expect(paragraphLabels(MD)).toEqual([
      { text: 'One.', label: '§1' },
      { text: 'Two.', label: 'DL 1.1' },
      { text: 'Three.', label: 'DL 1.1' },
    ]);
  });
});

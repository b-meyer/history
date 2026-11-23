// MIRRORS the library repo's `locate` in tools/passages.ts (with `collapse` from
// tools/extract/markdown.ts). History cannot import from the library, so this is a copy: change
// both together, and keep locate.test.ts in step with the library's `locate` tests. The only
// additions here are `locateParagraphs`, `paragraphLabels` and the `Block` type, which the quote
// check needs to hash the matched paragraphs and to say where an excerpt sits instead.

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'para'; text: string }
  | { type: 'page'; label: string }
  | { type: 'ref'; label: string };

/** Collapses every whitespace run, soft wraps included, to one space, in NFC. */
export function collapse(text: string): string {
  return text.normalize('NFC').replaceAll(/\s+/gu, ' ').trim();
}

const FRONT = /^---\n([\s\S]*?)\n---\n/u;
const HEADING = /^(#{1,6}) (.*)$/u;
const MARKER = /^<!-- (page|ref) (.+) -->$/u;

/** The original files text.md's front matter names. */
export function frontOriginals(md: string): string[] {
  const front = FRONT.exec(md.replaceAll('\r\n', '\n'))?.[1] ?? '';
  const line = /^original: (.*)$/mu.exec(front)?.[1] ?? '';
  return line === '' ? [] : line.split(', ');
}

/** text.md back into blocks: headings, page and ref markers, and paragraphs. */
export function parseText(md: string): Block[] {
  const body = md.replaceAll('\r\n', '\n').replace(FRONT, '');
  return body
    .split(/\n{2,}/u)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk !== '')
    .map((chunk): Block => {
      const heading = HEADING.exec(chunk);
      if (heading !== null) {
        return { type: 'heading', level: heading[1]?.length ?? 1, text: heading[2] ?? '' };
      }
      const marker = MARKER.exec(chunk);
      if (marker !== null) {
        return { type: marker[1] === 'page' ? 'page' : 'ref', label: marker[2] ?? '' };
      }
      return { type: 'para', text: chunk.replace(/^\\/u, '') };
    });
}

const SECTION = /^(\d+(?:\.\d+)*)\.?(?:\s|$)/u;
const CHAPTER = /^(?:CHAP(?:TER)?\.?\s+)?([IVXLC]+)\.?(?:\s|$)/u;

/** The deepest numbered heading as `§3.2.1` or `ch. IV`, else `preamble`. */
function sectionLocator(heading: readonly string[]): string {
  for (const text of heading.toReversed()) {
    const section = SECTION.exec(text)?.[1];
    if (section !== undefined) return `§${section}`;
    const chapter = CHAPTER.exec(text)?.[1];
    if (chapter !== undefined) return `ch. ${chapter}`;
  }
  return 'preamble';
}

type Cursor = {
  heading: string[];
  page?: string;
  ref?: string;
  last?: 'page' | 'ref';
  file?: string;
};

function locatorOf(cursor: Cursor): string {
  if (cursor.last === 'page' && cursor.page !== undefined) return `p. ${cursor.page}`;
  if (cursor.last === 'ref' && cursor.ref !== undefined) return cursor.ref;
  return sectionLocator(cursor.heading);
}

/** Moves the cursor past a heading or marker. A ref naming an original starts that file. */
function advance(cursor: Cursor, block: Block, files: Map<string, string>): Cursor {
  if (block.type === 'heading') {
    return { ...cursor, heading: [...cursor.heading.slice(0, block.level - 1), block.text] };
  }
  if (block.type === 'page') return { ...cursor, page: block.label, last: 'page' };
  if (block.type === 'ref') {
    const file = files.get(block.label);
    if (file !== undefined) return { heading: [], file };
    return { ...cursor, ref: block.label, last: 'ref' };
  }
  return cursor;
}

/** Thrown by `locate` for a locator that is not in any known form. */
export class LocatorError extends Error {}

type Where = {
  stack: readonly string[];
  label: string;
  page?: string;
  refOcc: number;
  refLabel?: string;
};

function sectionNumber(heading: string): string | undefined {
  return SECTION.exec(heading)?.[1];
}

function chapterNumber(heading: string): string | undefined {
  return CHAPTER.exec(heading)?.[1];
}

/**
 * The text of text.md that a claim's `locator` names, as whitespace-collapsed spans (paragraphs
 * joined by a space). An excerpt must lie wholly inside one span. An empty result means the
 * locator is well formed but names nothing in this text; a malformed locator throws LocatorError.
 *
 * Rules (port these to any other quote check):
 * - `preamble`: the paragraphs the library's passage index labels preamble: no page or ref marker seen yet in the
 *   file, and no numbered or chapter heading above them.
 * - `§3.1`: every paragraph under a heading numbered 3.1, including its subsections (3.1.2, ...),
 *   whatever page or ref markers sit between. A heading's number is its leading digits and dots
 *   (`## 3.1 Religion`, `# 1. Life`). `§3` does not match 3.10 or 31.
 * - `ch. IV`: every paragraph under a heading whose leading word is that roman numeral
 *   (`CHAPTER IV.`, `IV.`), subheadings included.
 * - `p. 129`: the paragraphs from `<!-- page 129 -->` up to the next page marker (or the next
 *   file's ref marker). Ref markers and headings inside the page do not end it. An excerpt does NOT
 *   run across the break into the next page: a quotation spanning pages cites a range, `p. 129-130`
 *   (also `pp.`, en dash), the union of the numeric pages in between. A page number appearing twice
 *   (a work split over files) gives two spans.
 * - Any other locator is a canonical reference label (`DL 3.7`): from `<!-- ref DL 3.7 -->` up to
 *   the next ref marker of any kind. Page markers and headings inside do not end it. An exact label
 *   wins; failing that `DL 8.1-8.3` spans from the first marker to the end of the
 *   range's last ref, inclusive.
 * - Matching is on whitespace-collapsed text, as everywhere else; markers and headings are not text.
 */
export function locate(md: string, locator: string): string[] {
  return locateParagraphs(md, locator).map((span) => span.join(' '));
}

/** The same spans as `locate`, each as its collapsed paragraphs. */
export function locateParagraphs(md: string, locator: string): string[][] {
  const loc = collapse(locator);
  const { entries, refs } = walk(md);
  const predicate = predicateFor(loc, refs);
  const spans: string[][] = [];
  let open: string[] | undefined;
  for (const entry of entries) {
    if (!predicate(entry.at)) {
      open = undefined;
      continue;
    }
    if (open === undefined) {
      open = [];
      spans.push(open);
    }
    open.push(entry.text);
  }
  return spans;
}

/** Every paragraph of text.md, collapsed, with the locator the library's index gives it. */
export function paragraphLabels(md: string): { text: string; label: string }[] {
  return walk(md).entries.map((entry) => ({ text: entry.text, label: entry.at.label }));
}

/** Every paragraph with where it sits, and the ref labels in document order. */
function walk(md: string) {
  const files = new Map(frontOriginals(md).map((file) => [file.replace(/\.[^.]+$/u, ''), file]));
  const entries: { text: string; at: Where }[] = [];
  const refs: string[] = [];
  let cursor: Cursor = { heading: [] };
  let refOcc = -1;
  let refLabel: string | undefined;
  for (const block of parseText(md)) {
    if (block.type === 'para') {
      const at: Where = { stack: cursor.heading, label: locatorOf(cursor), refOcc };
      if (cursor.page !== undefined) at.page = cursor.page;
      if (refLabel !== undefined) at.refLabel = refLabel;
      entries.push({ text: collapse(block.text), at });
      continue;
    }
    if (block.type === 'ref') {
      refs.push(block.label);
      refOcc = refs.length - 1;
      refLabel = block.label;
    }
    cursor = advance(cursor, block, files);
  }
  return { entries, refs };
}

function predicateFor(loc: string, refs: readonly string[]): (at: Where) => boolean {
  if (loc === 'preamble') return (at) => at.label === 'preamble';
  if (loc.startsWith('§')) {
    const section = /^§(\d+(?:\.\d+)*)$/u.exec(loc)?.[1];
    if (section === undefined) throw new LocatorError(`'${loc}' is not a section locator (§3.1)`);
    return (at) =>
      at.stack.some((heading) => {
        const number = sectionNumber(heading);
        return number !== undefined && (number === section || number.startsWith(`${section}.`));
      });
  }
  if (loc.startsWith('ch.')) {
    const chapter = /^ch\. ([IVXLC]+)$/u.exec(loc)?.[1];
    if (chapter === undefined) throw new LocatorError(`'${loc}' is not a chapter locator (ch. IV)`);
    return (at) => at.stack.some((heading) => chapterNumber(heading) === chapter);
  }
  if (/^pp?\./u.test(loc)) return pagePredicate(loc);
  if (loc === '') throw new LocatorError('empty locator');
  const range = refs.includes(loc) ? undefined : refRange(loc, refs);
  if (range === undefined) return (at) => at.refLabel === loc;
  return (at) => at.refOcc >= range[0] && at.refOcc <= range[1];
}

function pagePredicate(loc: string): (at: Where) => boolean {
  const pages = /^pp?\. ?(\w+)(?:\s?[-–]\s?(\w+))?$/u.exec(loc);
  if (pages === null) throw new LocatorError(`'${loc}' is not a page locator (p. 12 or p. 12-13)`);
  const [, from = '', to] = pages;
  if (to === undefined) return (at) => at.page === from;
  const lo = Number(from);
  const hi = Number(to);
  if (!/^\d+$/u.test(from) || !/^\d+$/u.test(to) || lo > hi) {
    throw new LocatorError(`'${loc}' is not a numeric page range in ascending order`);
  }
  return (at) => {
    const page = at.page !== undefined && /^\d+$/u.test(at.page) ? Number(at.page) : Number.NaN;
    return page >= lo && page <= hi;
  };
}

/** `DL 8.1-8.3` (the end may drop the shared prefix) as the occurrence indexes of its first and last ref marker. */
function refRange(loc: string, refs: readonly string[]): [number, number] | undefined {
  const split = /^(.+?)\s?[-–]\s?(\S+)$/u.exec(loc);
  const first = split?.[1] ?? '';
  const last = split?.[2] ?? '';
  const start = refs.indexOf(first);
  if (start === -1) return undefined;
  const lead = /^(\D*)/u.exec(first)?.[1] ?? '';
  const ends = [last, `${lead}${last}`].map((label) => refs.indexOf(label, start));
  const end = ends.find((index) => index !== -1);
  return end === undefined ? undefined : [start, end];
}

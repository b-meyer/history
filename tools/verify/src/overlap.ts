import { paragraphLabels } from './locate.ts';
import type { Problem } from './quoteCheck.ts';

// The overlap flag: a run of RUN_WORDS or more consecutive words in a wiki page, outside quote
// marks, that also appears in the text.md of a source the page cites. A model drafting from
// retrieved passages can reproduce a source's wording without quote marks; this catches it.
//
// Words are compared lowercase, NFC, letters and digits only, so case and punctuation do not
// hide a match. Quoted text is skipped: straight or curly double quotes (a quote left open ends at
// the paragraph break) and blockquote lines. Markdown furniture is dropped first: front matter,
// headings, code fences, HTML comments, `[@key, locator]` citations, link targets and `[[id]]`.

export const RUN_WORDS = 12;

type Token = { word: string; line: number; paragraph: number; quoted: boolean };

const QUOTES = /(["“”])/u;

function words(text: string): string[] {
  return (
    text
      .normalize('NFC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function stripMarkup(line: string): string {
  return line
    .replaceAll(/<!--.*?-->/gu, ' ')
    .replaceAll(/\[@[^\]]*\]/gu, ' ')
    .replaceAll(/\[\[([^\]|]+)\|([^\]]+)\]\]/gu, '$2')
    .replaceAll(/\[\[([^\]]+)\]\]/gu, '$1')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/gu, '$1');
}

/** A page's words with their line, paragraph and whether a quote mark or blockquote covers them. */
export function pageTokens(md: string): Token[] {
  const tokens: Token[] = [];
  const lines = md.replaceAll('\r\n', '\n').split('\n');
  let paragraph = 0;
  let inQuote = false;
  let fence = false;
  let start = 0;
  if (lines[0] === '---') {
    const close = lines.indexOf('---', 1);
    start = close === -1 ? 0 : close + 1;
  }
  for (let at = start; at < lines.length; at++) {
    const raw = lines[at] ?? '';
    if (raw.trimStart().startsWith('```')) {
      fence = !fence;
      paragraph += 1;
      continue;
    }
    if (fence || raw.trim() === '' || /^#{1,6}\s/u.test(raw)) {
      paragraph += 1;
      inQuote = false;
      continue;
    }
    const block = /^\s*>/u.test(raw);
    const line = stripMarkup(raw.replace(/^\s*>+\s?/u, ''));
    for (const part of line.split(QUOTES)) {
      if (part === '"') inQuote = !inQuote;
      else if (part === '“') inQuote = true;
      else if (part === '”') inQuote = false;
      else {
        for (const word of words(part)) {
          tokens.push({ word, line: at + 1, paragraph, quoted: block || inQuote });
        }
      }
    }
  }
  return tokens;
}

/** Every RUN_WORDS-word window of each paragraph of a source's text.md. */
export function sourceGrams(md: string): Set<string> {
  const grams = new Set<string>();
  for (const { text } of paragraphLabels(md)) {
    const list = words(text);
    for (let at = 0; at + RUN_WORDS <= list.length; at++) {
      grams.add(list.slice(at, at + RUN_WORDS).join(' '));
    }
  }
  return grams;
}

/** The unquoted stretches of a page that match a source, one problem per stretch. */
export function findOverlaps(page: string, md: string, grams: ReadonlySet<string>): Problem[] {
  const problems: Problem[] = [];
  const tokens = pageTokens(md);
  let at = 0;
  while (at < tokens.length) {
    const first = tokens[at];
    if (first === undefined || first.quoted) {
      at += 1;
      continue;
    }
    let end = at;
    while (
      tokens[end + 1] !== undefined &&
      !tokens[end + 1]?.quoted &&
      tokens[end + 1]?.paragraph === first.paragraph
    ) {
      end += 1;
    }
    problems.push(...overlapsInRun(page, tokens.slice(at, end + 1), grams));
    at = end + 1;
  }
  return problems;
}

function overlapsInRun(page: string, run: readonly Token[], grams: ReadonlySet<string>): Problem[] {
  const problems: Problem[] = [];
  let matchStart = -1;
  let matchEnd = -1;
  const flush = () => {
    const first = run[matchStart];
    if (first === undefined) return;
    const count = matchEnd - matchStart + 1;
    const head = run
      .slice(matchStart, matchStart + 6)
      .map((token) => token.word)
      .join(' ');
    problems.push({
      type: 'overlap',
      where: `${page}:${first.line}`,
      message: `${count} consecutive unquoted words match a cited source: ${head} ...`,
    });
  };
  for (let at = 0; at + RUN_WORDS <= run.length; at++) {
    const gram = run
      .slice(at, at + RUN_WORDS)
      .map((token) => token.word)
      .join(' ');
    if (!grams.has(gram)) continue;
    if (matchStart !== -1 && at <= matchEnd) {
      matchEnd = at + RUN_WORDS - 1;
      continue;
    }
    if (matchStart !== -1) flush();
    matchStart = at;
    matchEnd = at + RUN_WORDS - 1;
  }
  if (matchStart !== -1) flush();
  return problems;
}

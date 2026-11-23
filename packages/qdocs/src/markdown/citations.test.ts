import MarkdownIt from 'markdown-it';
import { describe, expect, it, vi } from 'vite-plus/test';
import { mdCitations, type CitationData } from './citations';
import { mdLinkRewriter } from './linkRewriter';

const data: CitationData = {
  sources: new Map([
    [
      'lives',
      {
        title: 'Lives of Eminent Philosophers',
        authors: ['Diogenes Laertius'],
        translators: ['R. D. Hicks'],
        publisher: 'Loeb',
        published: '1925',
        url: 'https://example.org/lives',
      },
    ],
    ['plain', { title: 'A <Plain> Work' }],
  ]),
  entityNames: new Map([
    ['porphyry', 'Porphyry'],
    ['plotinus', 'Plotinus'],
  ]),
  articles: new Map([['plotinus', '/wiki/platonism/Plotinus']]),
};

function render(src: string, getData = (): CitationData => data): string {
  const md = new MarkdownIt();
  md.use(mdLinkRewriter);
  md.use(mdCitations, getData);
  return md.render(src, { id: 'wiki/test.md' });
}

describe('mdCitations notes', () => {
  it('renders a numbered superscript link and a Sources list', () => {
    const out = render('Claim [@lives, 8.1].');
    expect(out).toContain('<sup class="cite" id="cite-ref-1"><a href="#cite-1">1</a></sup>');
    expect(out).toContain('<h2 id="sources">Sources</h2>');
    expect(out).toContain(
      '<li id="cite-1">Diogenes Laertius. <cite>Lives of Eminent Philosophers</cite>.',
    );
    expect(out).toContain('Translated by R. D. Hicks. Loeb, 1925.');
    expect(out).toContain('<span class="cite-locator">8.1.</span>');
    expect(out).toContain('href="https://example.org/lives"');
  });

  it('allows a missing locator', () => {
    const out = render('Claim [@plain].');
    expect(out).toContain('<a href="#cite-1">1</a>');
    expect(out).not.toContain('cite-locator');
  });

  it('numbers by first use and reuses the number for the same key and locator', () => {
    const out = render('A [@lives, 1] B [@plain] C [@lives, 1] D [@lives, 2].');
    expect(out.match(/<sup class="cite"/gu)).toHaveLength(4);
    expect(out.match(/<li id="cite-/gu)).toHaveLength(3);
    expect(out).toContain('<sup class="cite"><a href="#cite-1">1</a></sup>');
    expect(out).toContain('<li id="cite-3">');
    expect(out.match(/id="cite-ref-1"/gu)).toHaveLength(1);
  });

  it('escapes source fields', () => {
    expect(render('x [@plain]')).toContain('<cite>A &lt;Plain&gt; Work</cite>');
  });

  it('numbers each page on its own', () => {
    const md = new MarkdownIt();
    md.use(mdCitations, () => data);
    md.render('[@plain]', { id: 'a.md' });
    expect(md.render('[@lives]', { id: 'b.md' })).toContain('<li id="cite-1">');
  });

  it('throws with the page path on an unknown key', () => {
    expect(() => render('x [@nope, 1]')).toThrow('wiki/test.md: unknown source key "nope"');
  });
});

describe('mdCitations entity links', () => {
  it('links to the article when the entity has one, with the graph name as text', () => {
    expect(render('[[plotinus]]')).toContain('<a href="/wiki/platonism/Plotinus">Plotinus</a>');
  });

  it('falls back to the record page', () => {
    expect(render('[[porphyry]]')).toContain('<a href="/e/porphyry">Porphyry</a>');
  });

  it('uses custom text', () => {
    expect(render('[[porphyry|his teacher]]')).toContain('<a href="/e/porphyry">his teacher</a>');
  });

  it('throws with the page path on an unknown ID', () => {
    expect(() => render('[[nobody]]')).toThrow('wiki/test.md: unknown entity ID "nobody"');
  });

  it('leaves the link rewriter and ordinary links alone', () => {
    const out = render('[Wu](wiki/Wu.md) and [[porphyry]] and [text](https://x.org)');
    expect(out).toContain('href="/wiki/Wu"');
    expect(out).toContain('href="/e/porphyry"');
    expect(out).toContain('href="https://x.org"');
  });
});

describe('mdCitations cost', () => {
  it('never loads data on a page without the syntax', () => {
    const getData = vi.fn(() => data);
    const out = render('Plain [text](a.md) with [brackets] and a [1] marker.', getData);
    expect(getData).not.toHaveBeenCalled();
    expect(out).not.toContain('Sources');
  });
});

import MarkdownIt from 'markdown-it';
import { describe, expect, it } from 'vite-plus/test';
import { mdCitations } from './citations';
import { mdPageNotice, type PageNotice } from './pageNotice';

const data = {
  sources: new Map([
    ['a', { title: 'A' }],
    ['b', { title: 'B' }],
  ]),
  entityNames: new Map<string, string>(),
  articles: new Map<string, string>(),
};

function render(src: string, notice: PageNotice, env?: object): string {
  const md = new MarkdownIt();
  md.use(mdCitations, () => data);
  md.use(mdPageNotice, notice);
  return md.render(src, env ?? { id: 'x.md' });
}

describe('mdPageNotice', () => {
  it('inserts the notice below the first level-1 heading', () => {
    const out = render('Intro\n\n# Title\n\nBody', () => '<p class="n">hi</p>');
    expect(out.indexOf('</h1>')).toBeLessThan(out.indexOf('class="n"'));
    expect(out.indexOf('class="n"')).toBeLessThan(out.indexOf('Body'));
  });

  it('inserts at the top when there is no heading', () => {
    expect(render('Body', () => '<p class="n">hi</p>').startsWith('<p class="n">')).toBe(true);
  });

  it('passes the id, the frontmatter and the distinct source keys', () => {
    let seen: unknown;
    render(
      '# T\n\n[@a, 1] [@a, 2] [@b]',
      (page) => {
        seen = page;
        return null;
      },
      { id: 'p.md', frontmatter: { audited: '2026-11-09' } },
    );
    expect(seen).toEqual({
      id: 'p.md',
      frontmatter: { audited: '2026-11-09' },
      sources: ['a', 'b'],
    });
  });

  it('adds nothing when the notice returns null', () => {
    expect(render('# T', () => null)).not.toContain('class="n"');
  });
});

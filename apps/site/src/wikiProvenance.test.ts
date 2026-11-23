import { describe, expect, it } from 'vite-plus/test';
import { mapLink, wikiProvenance } from '../wikiProvenance.ts';

const notice = wikiProvenance((entity) => (entity === 'porphyry' ? -233 : undefined));
const id = (path: string): string => `C:/x/apps/site/src/pages/${path}.md`;

describe('wikiProvenance', () => {
  it('states the source count and the audit date', () => {
    const html = notice({
      id: id('wiki/a/P'),
      frontmatter: { audited: '2026-11-09' },
      sources: ['a', 'b'],
    });
    expect(html).toContain(
      'Written with AI assistance from 2 library sources, for educational purposes; a study aid, not a primary source. Audited 2026-11-09.',
    );
    expect(html).not.toContain('Show on map');
  });

  it('says so when a page is not audited, and drops the count when it cites nothing', () => {
    const html = notice({ id: id('wiki/a/P'), frontmatter: {}, sources: [] });
    expect(html).toContain('Written with AI assistance, for educational');
    expect(html).toContain('Not yet audited.');
  });

  it('reads a date the frontmatter parser turned into a Date', () => {
    const html = notice({
      id: id('wiki/a/P'),
      frontmatter: { audited: new Date('2026-11-09') },
      sources: ['a'],
    });
    expect(html).toContain('from 1 library source,');
    expect(html).toContain('Audited 2026-11-09.');
  });

  it('adds a map link focused on the entity at its first year', () => {
    const html = notice({ id: id('wiki/a/P'), frontmatter: { entity: 'porphyry' }, sources: [] });
    expect(html).toContain('href="/map?focus=porphyry&amp;t=234bce"');
    expect(html).toContain('Show on map');
  });

  it('links the map without a year when the entity has no dates', () => {
    expect(mapLink('x')).toBe('/map?focus=x');
  });

  it('adds nothing to the wiki home or to pages outside the wiki', () => {
    expect(notice({ id: id('wiki/index'), frontmatter: {}, sources: [] })).toBeNull();
    expect(notice({ id: id('about'), frontmatter: {}, sources: [] })).toBeNull();
  });
});

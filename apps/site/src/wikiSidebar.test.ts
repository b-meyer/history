import { describe, expect, it } from 'vite-plus/test';
import { buildWikiSidebars, type SidebarPage } from '../wikiSidebar.ts';

function page(path: string, fields: Partial<SidebarPage> = {}): SidebarPage {
  return { path, title: path.split('/').at(-1) ?? path, extra: false, ...fields };
}

const pages: SidebarPage[] = [
  page('wiki/index', { title: 'Wiki' }),
  page('wiki/islam/index', { title: 'Islam' }),
  page('wiki/islam/Shia', { title: 'Shia', group: 'Branches', order: 20 }),
  page('wiki/islam/Sunni', { title: 'Sunni', group: 'Branches', order: 10 }),
  page('wiki/islam/Origins', { title: 'Origins', order: 1 }),
  page('wiki/islam/Notes', { title: 'Notes', group: 'More', extra: true }),
  page('wiki/islam/Early', { title: 'Early', group: 'History', order: 5 }),
  page('wiki/islam/sufism/index', { title: 'Sufism', order: 2 }),
  page('wiki/islam/sufism/Rumi', { title: 'Rumi', group: 'Poets' }),
  page('wiki/platonism/index', { title: 'Platonism' }),
];

const trees = buildWikiSidebars(pages);

describe('buildWikiSidebars', () => {
  it('makes one tree per collection, keyed by URL prefix', () => {
    expect(Object.keys(trees).toSorted()).toEqual([
      '/wiki/',
      '/wiki/islam/',
      '/wiki/islam/sufism/',
      '/wiki/platonism/',
    ]);
  });

  it('puts the hub first, then ungrouped pages, then groups by their first page', () => {
    const tree = trees['/wiki/islam/'] ?? [];
    expect(tree.slice(0, 2)).toEqual([
      { title: 'Islam', path: 'wiki/islam' },
      { title: 'Origins', path: 'wiki/islam/Origins' },
    ]);
    expect(
      tree.filter((entry) => 'group' in entry).map((entry) => (entry as { group: string }).group),
    ).toEqual(['History', 'Branches', 'More', 'Branches in Depth']);
  });

  it('sorts pages by order, then title, and marks extra groups', () => {
    const tree = trees['/wiki/islam/'] ?? [];
    const branches = tree.find((entry) => 'group' in entry && entry.group === 'Branches');
    expect(branches).toEqual({
      group: 'Branches',
      items: [
        { title: 'Sunni', path: 'wiki/islam/Sunni' },
        { title: 'Shia', path: 'wiki/islam/Shia' },
      ],
    });
    const more = tree.find((entry) => 'group' in entry && entry.group === 'More');
    expect(more).toMatchObject({ extra: true });
  });

  it('lists nested collections last, under Branches in Depth', () => {
    const tree = trees['/wiki/islam/'] ?? [];
    expect(tree.at(-1)).toEqual({
      group: 'Branches in Depth',
      items: [{ title: 'Sufism', path: 'wiki/islam/sufism' }],
    });
  });

  it('starts a spoke with a link back to its hub', () => {
    expect(trees['/wiki/islam/sufism/']).toEqual([
      { title: '← Islam', path: 'wiki/islam' },
      { title: 'Sufism', path: 'wiki/islam/sufism' },
      { group: 'Poets', items: [{ title: 'Rumi', path: 'wiki/islam/sufism/Rumi' }] },
    ]);
  });

  it('lists the collections on the wiki home', () => {
    expect(trees['/wiki/']).toEqual([
      { title: 'Wiki', path: 'wiki' },
      {
        group: 'Collections',
        items: [
          { title: 'Islam', path: 'wiki/islam' },
          { title: 'Platonism', path: 'wiki/platonism' },
        ],
      },
    ]);
  });

  it('gives the wiki root a tree with no home page', () => {
    expect(buildWikiSidebars([page('wiki/a/index', { title: 'A' })])['/wiki/']).toEqual([
      { group: 'Collections', items: [{ title: 'A', path: 'wiki/a' }] },
    ]);
  });

  it('sends a page in a folder without an index to the nearest collection above', () => {
    const tree = buildWikiSidebars([
      page('wiki/a/index', { title: 'A' }),
      page('wiki/a/deep/Page', { title: 'Page' }),
    ])['/wiki/a/'];
    expect(tree).toContainEqual({ title: 'Page', path: 'wiki/a/deep/Page' });
  });
});

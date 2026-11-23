import type { SidebarEntry, SidebarGroup, SidebarItem } from 'qdocs/config';

/** The frontmatter and location of one wiki page, as graph's readWikiPages reads them. */
export type SidebarPage = {
  /** Path from the pages root without extension: wiki/islam/sufism/Rumi. */
  path: string;
  title: string;
  group?: string | undefined;
  order?: number | undefined;
  extra: boolean;
};

const HOME = 'wiki';
const BRANCHES = 'Branches in Depth';
const COLLECTIONS = 'Collections';

const byOrder = (a: SidebarPage, b: SidebarPage): number =>
  (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY) ||
  a.title.localeCompare(b.title);

const item = (page: SidebarPage, collection?: string): SidebarItem => ({
  title: page.title,
  path:
    collection === undefined ? page.path : `${HOME}${collection === '' ? '' : `/${collection}`}`,
});

/** The folder of a page under wiki/: '' for wiki/Page, 'islam/sufism' for wiki/islam/sufism/Rumi. */
function folderOf(path: string): string {
  return path.split('/').slice(1, -1).join('/');
}

function parentOf(folder: string): string {
  return folder.split('/').slice(0, -1).join('/');
}

function toGroup(entry: { name: string; members: SidebarPage[]; extra: boolean }): SidebarGroup {
  const group: SidebarGroup = { group: entry.name, items: entry.members.map((page) => item(page)) };
  if (entry.extra) group.extra = true;
  return group;
}

function groupEntries(pages: SidebarPage[]): SidebarEntry[] {
  const loose = pages.filter((page) => page.group === undefined).toSorted(byOrder);
  const groups = new Map<string, SidebarPage[]>();
  for (const page of pages) {
    if (page.group === undefined) continue;
    groups.set(page.group, [...(groups.get(page.group) ?? []), page]);
  }
  const ranked = [...groups].map(([name, members]) => ({
    name,
    members: members.toSorted(byOrder),
    // A group is ordered by its first page; one page marked extra makes the whole group extra.
    first: members.toSorted(byOrder)[0],
    extra: members.some((page) => page.extra),
  }));
  ranked.sort(
    (a, b) =>
      Number(a.extra) - Number(b.extra) ||
      (a.first ? byOrder(a.first, b.first ?? a.first) : 0) ||
      a.name.localeCompare(b.name),
  );
  return [...loose.map((page) => item(page)), ...ranked.map((entry) => toGroup(entry))];
}

/**
 * One sidebar tree per wiki collection, keyed by URL prefix, ready for qdocs's longest-prefix match.
 *
 * - A folder under `wiki/` with an `index.md` is a collection, and that index is its hub. The wiki
 *   root is always one; its hub is `wiki/index.md` when that exists.
 * - A page belongs to the nearest collection above it. Inside a collection, ungrouped pages come
 *   first, then groups ordered by their first page (extra groups last), pages by `order` then title.
 * - A tree starts with a link back to the parent collection's hub (a spoke to its hub), then the
 *   collection's own hub, and ends with a "Branches in Depth" group linking the landing page of each
 *   collection nested directly inside it. The wiki root lists its collections as "Collections".
 */
export function buildWikiSidebars(pages: SidebarPage[]): Record<string, SidebarEntry[]> {
  const index = new Map(
    pages.filter((page) => page.path.endsWith('/index')).map((page) => [folderOf(page.path), page]),
  );
  const collections = new Set(['', ...index.keys()]);
  const collectionOf = (path: string): string => {
    let folder = folderOf(path);
    while (!collections.has(folder)) folder = parentOf(folder);
    return folder;
  };
  const parentCollection = (folder: string): string => {
    let parent = parentOf(folder);
    while (!collections.has(parent)) parent = parentOf(parent);
    return parent;
  };

  const trees: Record<string, SidebarEntry[]> = {};
  for (const folder of collections) {
    const hub = index.get(folder);
    const members = pages.filter(
      (page) => collectionOf(page.path) === folder && page !== hub && page.path !== `${HOME}/index`,
    );
    const nested = [...index]
      .filter(([other]) => other !== '' && parentCollection(other) === folder)
      .map(([, page]) => page)
      .toSorted(byOrder);

    const entries: SidebarEntry[] = [];
    if (folder !== '') {
      const parent = parentCollection(folder);
      const parentHub = index.get(parent);
      if (parent !== '' && parentHub) {
        entries.push({ title: `← ${parentHub.title}`, path: `${HOME}/${parent}` });
      }
    }
    if (hub) entries.push(item(hub, folder));
    entries.push(...groupEntries(members));
    if (nested.length > 0) {
      entries.push({
        group: folder === '' ? COLLECTIONS : BRANCHES,
        items: nested.map((page) => item(page, folderOf(page.path))),
      });
    }
    trees[`/${HOME}${folder === '' ? '' : `/${folder}`}/`] = entries;
  }
  return trees;
}

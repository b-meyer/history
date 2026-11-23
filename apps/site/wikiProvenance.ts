import { formatYearParam } from 'map/url';
import type { PageNotice } from 'qdocs/pageNotice';

const WIKI_PAGE = /\/src\/pages\/(wiki\/.+)\.md$/u;

/** The first year of an entity's dated claims, astronomical, or null when it has none. */
export type StartYear = (entity: string) => number | null | undefined;

function dateText(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** /map focused on the entity, at its first year when it has one. */
export function mapLink(entity: string, start: number | null | undefined): string {
  const time = start === null || start === undefined ? '' : `&t=${formatYearParam(start)}`;
  return `/map?focus=${entity}${time}`;
}

/**
 * The line under each wiki page's title: the AI-assistance statement with the number of sources the
 * page cites, when it was audited (or that it was not), and a "Show on map" link for a page that is
 * an entity's home article. The wiki home page has none.
 */
export function wikiProvenance(startYear: StartYear): PageNotice {
  return ({ id, frontmatter, sources }) => {
    const path = WIKI_PAGE.exec(id)?.[1];
    if (path === undefined || path === 'wiki/index') return null;

    const from =
      sources.length === 0
        ? ''
        : ` from ${sources.length} library ${sources.length === 1 ? 'source' : 'sources'}`;
    const audited = dateText(frontmatter['audited']);
    const entity = typeof frontmatter['entity'] === 'string' ? frontmatter['entity'] : undefined;
    const map =
      entity === undefined
        ? ''
        : ` <a href="${mapLink(entity, startYear(entity)).replaceAll('&', '&amp;')}">Show on map</a>`;

    return (
      `<p class="provenance not-prose my-4 text-sm text-gray-600">` +
      `Written with AI assistance${from}, for educational purposes; a study aid, not a primary source. ` +
      `${audited === undefined ? 'Not yet audited.' : `Audited ${audited}.`}${map}</p>`
    );
  };
}

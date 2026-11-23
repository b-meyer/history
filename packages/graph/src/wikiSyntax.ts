// The wiki's inline syntax as the graph sees it. qdocs's citations plugin renders the same
// syntax; apps/site tests that the two patterns agree, because graph must not import qdocs.

/** `[@key, locator]`, the locator optional. The plugin's CITE_RE without its anchor. */
export const CITE_RE = /\[@([a-z0-9]+(?:-[a-z0-9]+)*)(?:,\s*([^\]]*?))?\s*\]/gu;
/** `[[id]]` or `[[id|text]]`. The plugin's ENTITY_RE without its anchor. */
export const ENTITY_RE = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^\]]+))?\]\]/gu;

export type Cite = { key: string; locator: string };

export type WikiRefs = {
  /** Cites in order of use, each key and locator pair once: the page's notes, in numbered order. */
  cites: Cite[];
  /** Entity IDs linked with [[id]], in order of use, each once. */
  entities: string[];
};

/** Code is not parsed as wiki syntax, so leave fenced blocks and inline code spans out. */
function withoutCode(markdown: string): string {
  return markdown
    .replaceAll(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\1[`~]*[ \t]*(?=\n|$)|$)/gmu, '')
    .replaceAll(/(`+)[^`]*?\1/gu, '');
}

/** The cites and entity links a page's markdown body uses, as the plugin would number them. */
export function findWikiRefs(body: string): WikiRefs {
  const text = withoutCode(body);
  const seen = new Set<string>();
  const cites: Cite[] = [];
  for (const match of text.matchAll(CITE_RE)) {
    if (match.index > 0 && text[match.index - 1] === '\\') continue;
    const cite = { key: match[1] ?? '', locator: (match[2] ?? '').trim() };
    const id = `${cite.key}|${cite.locator}`;
    if (seen.has(id)) continue;
    seen.add(id);
    cites.push(cite);
  }
  const entities = new Set<string>();
  for (const match of text.matchAll(ENTITY_RE)) {
    if (match.index > 0 && text[match.index - 1] === '\\') continue;
    entities.add(match[1] ?? '');
  }
  return { cites, entities: [...entities] };
}

import { CITE_RE as graphCite, ENTITY_RE as graphEntity } from 'graph/wikiSyntax';
import { CITE_RE, ENTITY_RE } from 'qdocs/citations';
import { describe, expect, it } from 'vite-plus/test';

// graph reads the wiki syntax without depending on qdocs, which renders it. The two patterns must
// stay the same apart from the anchor.
describe('wiki syntax patterns', () => {
  it('agree between graph and the qdocs citations plugin', () => {
    expect(CITE_RE.source.replace(/^\^/u, '')).toBe(graphCite.source);
    expect(ENTITY_RE.source.replace(/^\^/u, '')).toBe(graphEntity.source);
  });
});

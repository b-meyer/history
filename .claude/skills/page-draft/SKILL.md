---
name: page-draft
description: Draft one named wiki page from the graph record and library passages, writing the page and its data/citations file with every factual sentence cited. Use when the operator asks to draft, write or redraft a wiki page and names it. Never sets audited, never creates map facts (claims, entities or places), never runs on a page the operator didn't name, and stops when the page's core can't be supported.
---

# page-draft

Drafts **one page the operator names**, as `apps/site/src/pages/wiki/<collection>/<Page>.md` plus `data/citations/<collection>/<Page>.yaml`. Run it from the history repo root. The library is the checkout `LIBRARY_DIR` names (read the variable; never print `.env`). The plan, if there is one, is `plans/wiki-<collection>.md`.

## 1. Gather context

1. **The graph record.** `data/entities/<type>/<id>.yaml` for the page's entity: names, dates, and every claim with its sources, stance and grade. The same record renders at `/e/<id>`. Read the linked entities' names too, since they supply `[[id]]` links.
2. **Library passages.** In `$LIBRARY_DIR` run `vp run index` if needed, then `vp run search "<terms>" --key <key>`. Read the cited `sources/<key>/text.md` around each hit: the whole paragraph, the nearest heading, and the `<!-- page N -->` or `<!-- ref ... -->` marker above it. Draft only from text you have read.
3. **The syntax.** A page, its cites and the citations file follow `packages/graph/src/wiki.ts` and `wikiSyntax.ts`. A cite is `[@key, locator]` and a link to an entity is `[[id]]` or `[[id|text]]`.

## 2. Write the page

Frontmatter, then a `# Title` heading and the body:

```markdown
---
title: 'Iamblichus'
description: 'Syrian Neoplatonist who recast the school around Pythagorean number and ritual.'
group: 'Late Platonists'
order: 30
entity: iamblichus
---
```

- Use the plan's `group` and `order`. **Never write `audited`**; only an audit pass sets it. A topic page omits `entity`.
- **Every factual sentence carries a cite** `[@key, locator]`: a source key from `data/sources/`, with a locator that resolves in that source's `text.md` (`DL 8.79`, `p. 129`, `§3.2`, `ch. IV`, `preamble`). Use what the search printed; never invent a finer one. A claim from the graph is cited to the sources that claim lists.
- **Your own words.** Paraphrase. A run of 12 or more words from a source outside quote marks is flagged by the overlap check. A phrase worth keeping is put in double quotation marks and cited.
- **Links.** `[[id]]` for an entity, which resolves to its home article or record page. A link to another page is `[Display](collection/Page.md)`, root-relative from `wiki/`, and the file must exist. One entity has one home article, so link to it rather than rewriting it.
- **Content rules.** Follow `AGENTS.md` "Content writing" §1-§40: plain verbs, no significance claims, no participial padding, no triads, title-case headings.
- **Word the claim at its grade.** A claim with basis `tradition` (a life or the tradition's own account) is attributed in the sentence ("Iamblichus says…", "the Pythagorean lives tell…"), never stated as fact. A grade C or a disputed claim says it is uncertain or contested and names who holds which view. Only an A claim is stated plainly.
- **No map facts.** Create no claim, entity or place. If the sources support a link the graph lacks (a teacher, a place, a date), leave it out of the page's statements of fact or state it only as the source states it, and list it in the hand-back as a proposed claim.
- **Dropped sentences.** If no passage supports a sentence, delete the sentence. If the page's core cannot be supported (its entity has no usable passage, or too little survives to be an article), stop, write nothing, and report why.

## 3. Write the citations file

`data/citations/<collection>/<Page>.yaml` is an ordered list, one entry per **distinct cite**, counted by first use of each `key` and `locator` pair in the page's body (code spans and fenced code do not count; a backslash-escaped cite does not count). A repeat of the same key and locator shares its entry; the same key with another locator is a new entry.

```yaml
- key: eunapius-lives
  locator: VP 458
  excerpt: 'the words from text.md'
```

- `key` and `locator` match the cite exactly as written (the locator trimmed; empty when the cite gives none).
- `excerpt` is the fewest words that carry the sentence, copied **character for character** from the cited span of `text.md`. Single-quote it in YAML and double any `'` inside. It is published, so keep it short.
- Leave `passage` out; `vp run verify --write` fills it.
- A page with no cites has no citations file. The file's path is the page's path without `wiki/`.

## 4. Check and hand back

1. `LIBRARY_DIR=<library> vp run verify` and fix every problem in your own files: recopy an excerpt that isn't found, correct a locator, rewrite an unquoted run. Never edit `text.md`. Then `vp run verify -- --write` to fill `passage`. Problems in other files are reported, not fixed.
2. `vp run fix`, then `vp run --no-cache ready`. Fix what your files cause.

Hand back: the page and citations paths, the sources used, sentences dropped for lack of support, proposed claims (subject, predicate, object, the passage that supports it), entities the page needed but the graph lacks, and the next step (an independent audit of the page).

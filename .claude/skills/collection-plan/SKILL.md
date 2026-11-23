---
name: collection-plan
description: Plan the pages of one wiki collection from the graph and the library, writing plans/wiki-<collection>.md with each page's slug, title, entity, group, order, claims, sources and the gaps. Use when the operator asks to plan, outline or scope a wiki collection (hub, spoke or bridge) and names it. Drafts no prose, never runs on a collection the operator didn't name, and changes no data.
---

# collection-plan

Plans **one collection the operator names**, from the scope they give. The output is a plan file; the pages are written later by `page-draft`, one at a time, on the operator's say-so. Run it from the history repo root. The library is the checkout `LIBRARY_DIR` names (read the variable; never print `.env`).

## 1. Gather context

1. **Read the scope.** The operator gives the collection (`platonism`, `islam/sufism`) and what it should cover. If it names a kind (hub, spoke, bridge), follow PLAN.md "Collections: hubs and spokes". The folder is `apps/site/src/pages/wiki/<collection>/`.
2. **Read what exists.**
   - `apps/site/src/pages/wiki/**`: pages already written, and which entity each is the home article of (`entity:` in frontmatter).
   - `data/entities/<type>/*.yaml`: the entities and claims the graph holds. `data/vocab/predicates.yaml` gives the predicate labels.
   - `data/sources/*.yaml` and `data/citations/`: sources already cited.
3. **Read the library.** Run `vp run index` then `vp run search "<terms>" [--key <key>]` in `$LIBRARY_DIR` for each topic. Note the keys and the locators the hits print. `ls $LIBRARY_DIR/sources/` shows what is catalogued; a key needs a `text.md` to be usable.

## 2. Choose the pages

- **One entity, one article.** An entity already the home article of a page elsewhere gets no second page; the plan links to it with `[[id]]`. A new page names its entity in `entity:`, and no two pages name the same one.
- **A topic page** (no entity) is fine for a theme that is not one person, work or school. Name the topic instead of an entity.
- **The collection's landing page is `index.md`.** A spoke's landing page is also the hub's overview of that branch, so the hub plan links to it and does not repeat it.
- **Keep the graph in charge of facts.** A page draws on claims the graph already holds and on library passages. It never proposes a new entity or claim by itself; those go in the gaps.
- Spin a spoke off only when depth would bury the hub. Until then, supplementary material is a group with `extra: true`.

## 3. Write the plan

Write `plans/wiki-<collection with / as ->.md` (`plans/wiki-islam-sufism.md`), creating `plans/` if absent. Plain markdown, one table row per page and one section per page below it:

```markdown
# Wiki plan: <collection>

Scope: <the operator's scope in one or two sentences>

| Page | Path | Entity or topic | Group | Order |
| --- | --- | --- | --- | --- |
| Iamblichus | platonism/Iamblichus.md | iamblichus | Late Platonists | 30 |

## Iamblichus

- Title: Iamblichus
- Description: <one sentence for frontmatter>
- Claims: iamblichus.student-of.porphyry, iamblichus.active-at.apamea
- Sources: eunapius-lives (VP 458), sep-iamblichus (§2)
- Links: [[porphyry]], [[apamea]]
- Notes: <anything the drafter needs, such as a dispute to present>

## Gaps

- Entities missing from the graph: <id and type, why a page needs it>
- Sources missing from the library: <what and where the operator might get it>
- Claims the graph lacks: <subject predicate object, with the passage that suggests it>
```

- **Claims** are claim ids from `data/entities/`. **Sources** are library keys with the locators the search printed; never invent a finer one.
- `group` and `order` give the sidebar its shape; leave gaps in `order` (10, 20, 30) so pages can be added.
- Descriptions and titles follow the content rules in `AGENTS.md` (§1-§40).
- Do not draft article prose, citations files or frontmatter files here.

## 4. Hand back

Report the plan path, the page count, and the gaps by kind. The next step is `page-draft <page>` for each page the operator chooses.

# Project Agent Reference

## Workspace

```
history/                     ← repo root (pnpm workspace)
├── apps/site/               the only deployable app: /, /wiki, /e and /map
├── packages/qdocs/          qdocs — the docs framework, carried over from the docs POC
├── packages/graph/          the graph: schema, validation, and the files the site reads
├── tools/verify/            dev-only quote check against the library checkout (never a dependency of the site)
├── data/                    the graph as YAML: entities/<type>/<id>.yaml, sources/<key>.yaml, vocab/
└── vite.config.ts           canonical lint + format config (whole workspace)
```

## The graph

- **Every claim is audited.** A claim in `data/` carries `confidence`, `basis`, `origin`, at least one source, and `audits`. `graph build` fails unless the claim has one passing `human` audit or two independent passing ones (different auditors, or a different source) and its latest audit isn't `flagged`; the site build runs it first. The drafting pass never adds an audit. An audit re-fetches the source and grades the claim without seeing the stored grade.
- **A link is stored once, on its subject.** The inverse (`teacher-of` for `student-of`) is derived at build from `data/vocab/predicates.yaml`. Never store both sides.
- **Dates are EDTF strings** (`0263`, `-0569~`, `02XX`, `0263/0268`), read as astronomical years (-569 is 570 BCE). Never use JavaScript `Date` for them.
- **YAML is read as failsafe**, so every scalar is a string and the schemas in `packages/graph/src/schema/` convert numbers and flags.
- **Generated files stay out of git.** `graph build` writes `apps/site/public/data/`.
- **Leads are never published.** `vp run dev:leads` overlays the library's unaudited Wikidata leads (from `LIBRARY_DIR`) on `/map`, served from memory by the dev server only. `vp run build` ends with `graph check-leads`, which fails if lead data reaches `public/data/` or `dist/`.

Stack: Vite + Vue 3 + qdocs-ssg (custom SSG, not SPA) + unplugin-vue-markdown + Tailwind 4. NOT VitePress.

The site is one app over one knowledge graph. Pages live in `apps/site/src/pages/`; every file there is a route. Source texts live in the separate private `library` repo and never enter this one.

- **The quote check mirrors the library.** `tools/verify/src/locate.ts` is a copy of `locate` in the library's `tools/passages.ts` (with `collapse`), and `locate.test.ts` is ported from its tests. Change both together. `vp run verify` reads the library read-only from `LIBRARY_DIR`, checks each excerpt in `data/entities/` and `data/citations/` within its locator, flags 12 or more unquoted words of a cited source in a wiki page, and exits non-zero on any problem. `--write` changes only the `passage` line (the first 16 hex digits of the SHA-256 of the collapsed paragraphs the excerpt touches, joined by a space). CI cannot read the library, so run it locally before pushing.

## Before finishing any task

1. `vp run fix` — autofix formatting and lint issues
2. `vp check` — verify no remaining format, lint, or type errors
3. `vp run test` — run all tests
4. If the task touched a build artifact or routing: `vp run build`

Always run `vp run fix` before `vp check` — `vp check` will fail on formatting issues that `vp run fix` would have caught automatically. Do not hand back with lint errors, type errors, or failing tests.

## Toolchain — `vp` is the sole entry point

| Command            | Does                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| `vp install`       | Install/refresh all deps                                                         |
| `vp check`         | Format + lint + type-check (whole workspace)                                     |
| `vp run fix`       | Autofix format/lint issues                                                       |
| `vp run build`     | Build the site (`qdocs-ssg` → static HTML/route)                                 |
| `vp run test`      | Run all tests (Vitest)                                                           |
| `vp run ready`     | Check, test and build — pre-push gate                                            |
| `vp run dev`       | Dev server for the site (HMR on `.md` changes)                                   |
| `vp run dev:leads` | Dev server with the library's leads on `/map` (set `LIBRARY_DIR`)                |
| `vp run verify`    | Quote check and overlap flag against `LIBRARY_DIR`; `-- --write` fills `passage` |

**`vp build` ≠ `vp run build`** — `vp build` invokes Vite's SPA path, skipping qdocs-ssg. Always use `vp run build`.
**`vp test` ≠ `vp run test`** — `vp test` runs current package only. Always use `vp run test`.
**`vp check` does NOT run as part of `vp run build`** — they are separate steps. `vp run ready` runs both.

All commands from the **repo root**.

## Import rules

- `@/` is **app-local** — `apps/site/vite.config.ts` maps it to its own `src/`. Never use it in `packages/`.
- Framework source uses **relative imports only** (`./components/AppHeader.vue`).
- App code reaches a package via its name: `qdocs/config` — never via relative paths crossing workspace boundaries.
- Files reachable from `vite.config.ts` require **explicit `.ts` extensions** (Node ESM; no directory imports).

## Conventions

- Vue SFCs: `<script setup>` only. No Options API.
- Composables: `use*` prefix (`useConfig`, `useTheme`).
- Framework chrome components: `App*` prefix (`AppHeader`, `AppNav`). Feature components omit it.
- Tailwind 4 is CSS-first via `@theme {}`. No `tailwind.config.js` — reintroducing it is a defect.
- Utility classes for layout/spacing/color. Scoped `<style>` only for rules Tailwind can't express.
- Use declared tokens (`text-primary-600`), not arbitrary values (`[#hex]`).
- Regex literals require the `u` flag (`/\.vue$/u`). Oxlint enforces this.
- Dependency versions live in `pnpm-workspace.yaml` catalog — never edit individual `package.json` versions directly.
- `vue-router@~5.0.7` is intentional (in-dev next major). Do not upgrade to v4.
- Cross-links in markdown: `[Display](Other.md)` — resolves to `/Other` from the site root. Never hardcode `/Other`.
- Sidebar groups of supplementary pages carry `extra: true` (between `group` and `items`) to render de-emphasized.

## Content writing

SCOPE: these rules apply only to `apps/site/src/pages/**/*.md` content files. Instruction files (AGENTS.md, CLAUDE.md, skill files, docs/) are exempt.

Write like a person describing a subject, not like a chatbot summarizing one.

§1 Significance inflation "vital role" / "underscores its significance" / "pivotal" / "stands as a testament" → state what it does; drop the significance claim
§3 Participial padding trailing "symbolizing…" / "reflecting…" / "contributing to…" → cut; stop at the fact
§4 Promotional adjectives remarkable, sophisticated, profound, holistic, vibrant → cut or reword; just say what it does
§7 AI vocabulary delve, tapestry (abstract), testament, showcase (v), pivotal, intricacies, → replace with plain verbs and nouns
interplay, fostering, garner, landscape (abstract), enduring, crucial
§8 Copula avoidance "serves as" / "stands as" / "marks a" / "represents a" → is / are / has
§9 Negative parallelism "not merely X; it is Y" / "not just X, but Y" → state Y directly
§14 Structural punctuation — – : ; in prose → rewrite naturally; do not swap one for another
ascii - only for: title/subtitle separators | annotation (Pali - English) | **Term** - desc
§15 Boldface overuse bold on non-essential phrases → remove; bold belongs on reference-list terms only
§16 Inline-header lists **Term:** or **Term.** in any list item → **Term** - desc (never colon or period inside bold)
§17 Title-case headings H2+ not in title case → capitalize every significant word
lowercase: a an the and but or for nor of in to at by (unless first or last word)
§23 Filler phrases "In order to" / "Due to the fact that" / "It is important to note that" → cut or compress
§24 Excessive hedging "could potentially possibly be argued" → direct claim or "may"
§25 Generic conclusions "The future looks bright" / "Exciting times lie ahead" → end on a specific fact
§27 Authority tropes "at its core" / "what really matters" / "fundamentally" → cut
§28 Signposting "Let's dive in" / "Let's explore" / "Here's what you need to know" → cut
§29 Fragmented headers warm-up sentence after heading that only restates it → cut
§31 Staccato drama 3+ short declarative fragments in a row for emphasis → rewrite as varied prose
§34 Temporal framing "In today's rapidly evolving X" / "In a world where" → state the claim directly
§35 Vague attribution "experts argue" / "some critics contend" / "research suggests" → name the source, or state the claim directly
§36 Additive transitions "Additionally," / "Furthermore," / "Moreover," / "In addition," → connect through sentence structure; cut the connector
§37 Triadic padding adj, adj, and adj stacked for completeness ("warm, accessible, and grounding") → state what is specific; cut the list
§38 Elegant variation synonym-swapping to avoid repeating a word ("constraints / norms / confines") → repeat the right word
§39 Challenges boilerplate "Despite its X, [subject] faces challenges including Y" → state challenges directly; no setup formula
§40 Diff-anchored docs describing what changed rather than what currently exists → write to current state; changelogs excepted

## New file placement

| Adding               | Where                                                    |
| -------------------- | -------------------------------------------------------- |
| New page             | `apps/site/src/pages/<path>/<Slug>.md`                   |
| Framework component  | `packages/qdocs/src/components/<Name>.vue`               |
| Composable           | `packages/qdocs/src/composables/use<Name>.ts`            |
| Markdown-it plugin   | `packages/qdocs/src/markdown/<name>.ts`                  |
| Runtime utility      | `packages/qdocs/src/runtime/<name>.ts`                   |
| New framework export | Named subpath in `packages/qdocs/package.json` `exports` |

## Testing

Tests colocate next to source (`useFoo.ts` + `useFoo.test.ts`). Three layers:

- **Unit** — pure logic, no DOM.
- **Composable integration** — `// @vitest-environment jsdom` docblock, minimal `defineComponent` mount.
- **Component** — `// @vitest-environment jsdom`, use `mountWithConfig` from `packages/qdocs/src/test-utils/mountWithConfig.ts`.

## Known traps

**Runtime conditionals don't tree-shake dynamic imports** — use the `__QDOCS_MERMAID__` Vite define flag pattern for optional-feature chunks.

**`ERR_UNSUPPORTED_DIR_IMPORT`** — add explicit `.ts` extension to any import reachable from `vite.config.ts`.

**Nested page folders need `src/pages/`** — the search indexer recurses only into a folder named `pages`.

## Documentation policy

Keep docs **evergreen**: write conventions and patterns, not enumerations of current state. Do not list secret names, resource names, or workflow files in documentation; point to the authoritative source (`infra/`, `.github/workflows/`) instead.

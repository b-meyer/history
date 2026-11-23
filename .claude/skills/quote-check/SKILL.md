---
name: quote-check
description: Run the quote check (vp run verify) over history's excerpts and wiki pages against the library checkout, explain each problem and apply the allowed fixes. Use when the operator asks to quote-check, verify excerpts, fill passage hashes or check pages for unquoted source wording. Never edits the library, never changes a promoted claim silently, and runs only when the operator starts it.
---

# quote-check

Confirms that every excerpt in `data/entities/` and `data/citations/` sits inside the text its locator names in the library, and that wiki pages do not reproduce source wording outside quote marks. Run it from the history repo root, only when the operator starts it.

## Running it

```
LIBRARY_DIR=<library checkout> vp run verify
LIBRARY_DIR=<library checkout> vp run verify -- --write
```

- `LIBRARY_DIR` names the library checkout (read it from `.env`; never print `.env`). The tool reads `sources/<key>/text.md` read-only and never copies library text into this repo.
- Without `--write` it only checks. It exits non-zero on any problem and prints one line per problem, then counts by type.
- `--write` fills or updates the `passage` hash of every source that matched, and changes nothing else in the YAML files. Check `git diff` afterwards: only `passage:` lines should differ. To try it on a copy of the data, add `--root <dir>`.
- The passage hash is the first 16 hex digits of the SHA-256 of the paragraphs the excerpt touches, whitespace-collapsed and joined by one space. It moves only when that text does.
- CI cannot read the private library, so it only checks that every source key and each cite's excerpt exists. The real match against the text happens here, before a push.

## Problem types

| Type | Meaning | Allowed fix |
| --- | --- | --- |
| `no-text` | The library has no `text.md` for the key | Report; the operator prepares the source in the library |
| `bad-locator` | The locator is not a known form (`§3.1`, `ch. IV`, `bk. VII`, `p. 12`, `p. 12-13`, a ref such as `DL 8.1`, `preamble`) | Correct the locator to what `vp run search` prints |
| `locator-unresolved` | The locator is well formed but names nothing in this text | Correct the locator, or report if the text's markers differ from the citation |
| `excerpt-outside-locator` | The excerpt is not within the locator's text; the message says whether it is found elsewhere and at which locator | Move the locator to where it is found, or recopy the excerpt from the cited text |
| `stale-passage` | The stored `passage` no longer matches the text | Rerun with `--write` after confirming the excerpt still says what the claim needs |
| `overlap` | 12 or more consecutive words of a cited source appear in a wiki page outside quote marks | Rewrite the sentence in your own words, or quote it in double quotation marks and cite it |
| `unwritable` | `--write` could not edit the file in place (a flow-style source) | Report |

A locator spans the text it names: a page ends at the next page marker, so a quotation across a page break cites a range (`p. 12-13`); a section includes its subsections; a ref runs to the next ref.

## Rules for fixing

- **Never edit `text.md`** or anything in the library. The text is the evidence.
- **Fix the excerpt or the locator to match the text**, never loosen the check. An excerpt stays short and character-for-character from the text.
- **A mismatch on a claim already in `data/entities/` is reported to the operator**, with the claim id, key, locator and where the text was found instead. A change to a published excerpt or locator is a re-audit, so do not make it silently. Fix excerpts and locators in a page's own `data/citations/` file when the operator asked you to check that page.
- A key with no `text.md` is not a fault in the data; report it.

Hand back: the counts by problem type, what you fixed (file and entry), and every problem you left for the operator with its claim id or cite number.

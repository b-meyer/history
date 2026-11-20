import { z } from 'zod';
import { edtf, entityType, isoDate, number, slug } from './common.ts';
import { AUDIT_VERDICT, BASIS, CONFIDENCE, ORIGIN, STANCE } from './vocab.ts';

/** One source behind a claim: what the source says, where, and in which words. */
export const claimSourceSchema = z.strictObject({
  key: slug,
  /** A canonical reference where one exists (VP 4–5, DK 14A1, Enn. 1.6.9), else a page. */
  locator: z.string().min(1),
  stance: z.enum(STANCE),
  /** Only the words the claim needs, from the cited edition. Published, so keep it short. */
  excerpt: z.string().min(1),
  /** Hash of the library passage; a fast path for the quote check, filled in by it. */
  passage: z.string().min(1).optional(),
});

/** One audit pass over a claim: who checked it, when, and what they found. */
export const auditSchema = z.strictObject({
  on: isoDate,
  /** The auditing model ID, such as claude-opus-5-5, or `human`. */
  by: z.string().min(1),
  verdict: z.enum(AUDIT_VERDICT),
  /** A different source the audit confirmed the claim against. */
  source: slug.optional(),
  note: z.string().min(1).optional(),
});
export type Audit = z.infer<typeof auditSchema>;

/** A dated, sourced and audited statement about the entity whose file holds it. */
export const claimSchema = z.strictObject({
  id: z
    .string()
    .regex(
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/u,
      'must be dot-separated slugs, starting with the entity ID',
    ),
  predicate: slug,
  object: slug.optional(),
  when: edtf.optional(),
  where: slug.optional(),
  confidence: z.enum(CONFIDENCE),
  basis: z.enum(BASIS),
  origin: z.enum(ORIGIN),
  audits: z.array(auditSchema).default([]),
  sources: z.array(claimSourceSchema).min(1, 'a claim needs at least one source'),
});
export type Claim = z.infer<typeof claimSchema>;

export const entitySchema = z.strictObject({
  id: slug,
  type: entityType,
  /** Names by language code; `en` is required and is the map label. */
  names: z.object({ en: z.string().min(1) }).catchall(z.string().min(1)),
  /** Sets what shows at each zoom level; higher shows earlier. */
  notability: number.optional(),
  /** External IDs, kept for matching and import; never used as URLs. */
  ids: z
    .strictObject({
      wikidata: z
        .string()
        .regex(/^Q\d+$/u)
        .optional(),
      pleiades: z.string().regex(/^\d+$/u).optional(),
      /** A place's GeoNames ID, where its coords come from GeoNames rather than Pleiades. */
      geonames: z.string().regex(/^\d+$/u).optional(),
    })
    .optional(),
  /** Places only: [longitude, latitude]. */
  coords: z.tuple([number, number]).optional(),
  /** Traditions only: the family it belongs to, such as Abrahamic or Indian. */
  family: z.string().min(1).optional(),
  /** Works only: the language it was written in, as a language code (grc, la, ar, sa). */
  language: z.string().min(2).optional(),
  /** Works only: whether it survives whole, in fragments, or not at all. */
  status: z.enum(['extant', 'fragmentary', 'lost']).optional(),
  /** Events only: what kind of event it is, such as war, council, founding or closure. */
  kind: slug.optional(),
  /** Traditions only: the map colour. */
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/iu, 'must be a hex colour such as #3b6e8f')
    .optional(),
  claims: z.array(claimSchema).default([]),
});
export type Entity = z.infer<typeof entitySchema>;

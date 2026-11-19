import { z } from 'zod';
import { entityType, flag, list, slug } from './common.ts';

export const CONFIDENCE = ['A', 'B', 'C'] as const;
export const BASIS = ['primary', 'scholarly', 'tradition'] as const;
export const ORIGIN = ['human', 'ai-extracted', 'import'] as const;
/** confirmed and changed pass; flagged holds the claim back from publishing. */
export const AUDIT_VERDICT = ['confirmed', 'changed', 'flagged'] as const;
export const STANCE = ['asserts', 'reports', 'disputes'] as const;

export type Confidence = (typeof CONFIDENCE)[number];
export type Basis = (typeof BASIS)[number];

/** data/vocab/predicates.yaml: one entry per predicate, keyed by its ID. */
export const predicateSchema = z.strictObject({
  label: z.string().min(1),
  /** The predicate as read from the object's side; derived at build, never stored. */
  inverse: slug.optional(),
  inverseLabel: z.string().min(1).optional(),
  subject: list(entityType),
  /** Entity types the object may be. Absent for a predicate with no object, such as `born`. */
  object: list(entityType).optional(),
  /** True when the claim must carry a `when`. */
  dated: flag.optional(),
  /** Restricts the evidence a claim may rest on, such as influence needing a scholarly basis. */
  basis: list(z.enum(BASIS)).optional(),
});
export type Predicate = z.infer<typeof predicateSchema>;

export const predicatesSchema = z.record(slug, predicateSchema);

/** data/vocab/confidence.yaml and basis.yaml: the reader-facing wording for each value. */
export const termSchema = z.strictObject({
  label: z.string().min(1),
  meaning: z.string().min(1),
});
export const confidenceSchema = z.strictObject({ A: termSchema, B: termSchema, C: termSchema });
export const basisSchema = z.strictObject({
  primary: termSchema,
  scholarly: termSchema,
  tradition: termSchema,
});

export type Vocab = {
  predicates: Record<string, Predicate>;
  confidence: z.infer<typeof confidenceSchema>;
  basis: z.infer<typeof basisSchema>;
};

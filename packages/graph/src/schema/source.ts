import { z } from 'zod';
import { edtf, flag, slug } from './common.ts';

/**
 * data/sources/<key>.yaml: one edition or translation, public bibliography only.
 * Fact fields and your annotation; never a publisher's blurb, abstract or contents.
 */
export const sourceSchema = z.strictObject({
  key: slug,
  kind: z.enum(['primary', 'secondary']),
  title: z.string().min(1),
  /** Absent for an anonymous work. */
  authors: z.array(z.string().min(1)).optional(),
  translators: z.array(z.string().min(1)).optional(),
  editors: z.array(z.string().min(1)).optional(),
  edition: z.string().min(1).optional(),
  publisher: z.string().min(1).optional(),
  /** Year of this edition's publication. */
  published: z
    .string()
    .regex(/^\d{4}$/u, 'must be a four-digit year')
    .optional(),
  /** When the work itself was written, so readers can judge the distance to its subject. */
  written: edtf.optional(),
  language: z.string().min(2).optional(),
  isbn: z
    .string()
    .regex(/^(?:\d{9}[\dX]|\d{13})$/u, 'must be an ISBN-10 or ISBN-13 without dashes')
    .optional(),
  doi: z
    .string()
    .regex(/^10\.\d{4,}\/\S+$/u, 'must be a DOI such as 10.1234/abc')
    .optional(),
  /** A public-domain or publisher page; never an unofficial copy. */
  url: z.url({ protocol: /^https?$/u, error: 'must be an http or https URL' }).optional(),
  readingList: flag.optional(),
  /** Your words: what it is good for, its level, which translation to start with. */
  annotation: z.string().min(1).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

import { z } from 'zod';
import { slug } from './common.ts';

/**
 * One entry of data/citations/<collection>/<Page>.yaml, the file beside a wiki page.
 *
 * The file is an ordered list. Entry N belongs to the Nth distinct cite of the page, counted by
 * first use of each key and locator pair, which is how the page numbers its notes: a repeat of the
 * same key and locator is the same note and shares the entry, the same key with another locator
 * is a new note and needs its own. A page cite and its entry must agree on key and locator.
 */
export const citeEntrySchema = z.strictObject({
  key: slug,
  /** As written in the page, [@key, locator]; empty when the page gives none. */
  locator: z.string().default(''),
  /** The words the note rests on, quoted from the source; checked against the library later. */
  excerpt: z.string().min(1),
  /** Hash of the library passage the excerpt was taken from. */
  passage: z.string().min(1).optional(),
});
export const citationsSchema = z.array(citeEntrySchema);
export type CiteEntry = z.infer<typeof citeEntrySchema>;

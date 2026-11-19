import { z } from 'zod';
import { isEdtf } from '../dates.ts';

// data/ is read as failsafe YAML, so every scalar arrives as a string. That keeps EDTF
// such as -0569 or 0263 from being read as numbers; the few numeric fields convert here.

export const ENTITY_TYPES = [
  'tradition',
  'school',
  'person',
  'work',
  'institution',
  'place',
  'event',
] as const;
export const entityType = z.enum(ENTITY_TYPES);
export type EntityType = z.infer<typeof entityType>;

/** Lowercase words joined by dashes: `porphyry`, `porphyry-life-of-plotinus`. */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'must be lowercase words joined by dashes');

export const edtf = z
  .string()
  .refine(isEdtf, 'must be an EDTF date such as 0263, -0569~, 02XX or 0263/0268');

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'must be a date as YYYY-MM-DD')
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    'must be a real calendar date',
  );

export const number = z
  .string()
  .regex(/^-?\d+(?:\.\d+)?$/u, 'must be a number')
  .transform(Number);

export const flag = z.enum(['true', 'false']).transform((value) => value === 'true');

/** A list that may be written as a single value. */
export function list<T extends z.ZodType>(item: T) {
  return z.union([item.transform((value) => [value]), z.array(item)]);
}

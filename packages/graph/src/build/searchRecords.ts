import { formatEdtf } from '../dates.ts';
import type { EntityRecord } from './records.ts';

/**
 * One record as a search entry. It has the shape of a qdocs `SearchEntry`, so the site's search
 * index can take it as it is; the graph never imports qdocs.
 */
export type RecordSearchEntry = {
  slug: string;
  pageTitle: string;
  heading: string;
  headingId: '';
  level: 1;
  body: string;
  entity: string;
  origin: 'record';
};

/** An astronomical year as EDTF: -569 is `-0569`, 263 is `0263`. */
function edtfYear(year: number): string {
  const digits = String(Math.abs(year)).padStart(4, '0');
  return year < 0 ? `-${digits}` : digits;
}

/** The record's span as reader-facing text, or '' when it has no dated claims. */
export function spanText({ start, end }: EntityRecord['span']): string {
  if (start === null && end === null) return '';
  if (start === null) return formatEdtf(`../${edtfYear(end!)}`);
  if (end === null || end === start) return formatEdtf(edtfYear(start));
  return formatEdtf(`${edtfYear(start)}/${edtfYear(end)}`);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * search-records.json: one entry per record. The heading is the English name; the body holds the
 * other names, the span and the names of the places the record's claims mention.
 */
export function buildSearchRecords(records: EntityRecord[]): RecordSearchEntry[] {
  return records
    .map((record) => {
      const name = record.names.en ?? record.id;
      const otherNames = Object.entries(record.names)
        .filter(([language]) => language !== 'en')
        .map(([, value]) => value);
      const places = new Set<string>();
      for (const claim of record.claims) {
        if (claim.where !== undefined) places.add(claim.where.name);
        if (claim.other?.type === 'place') places.add(claim.other.name);
      }
      const body = [...otherNames, spanText(record.span), ...places]
        .filter((part) => part !== '')
        .join(' · ');
      return {
        slug: `e/${record.id}`,
        pageTitle: capitalize(record.type),
        heading: name,
        headingId: '' as const,
        level: 1 as const,
        body,
        entity: record.id,
        origin: 'record' as const,
      };
    })
    .toSorted((a, b) => a.entity.localeCompare(b.entity));
}

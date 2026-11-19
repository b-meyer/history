// EDTF (Extended Date/Time Format) strings to integer year bounds, without JavaScript Date,
// which cannot represent BCE years safely. Years are astronomical: 0 is 1 BCE, -569 is 570 BCE.
//
// Supported, which covers what the graph needs:
//   1066, -0569             a year
//   0263-05, 0263-05-01     a month or day (reduced to its year)
//   02XX, 019X, -05XX       unspecified digits (a century or decade)
//   -0569~  0263?  0263%    approximate, uncertain, or both
//   0263/0268               an interval; either end may be open (..) or unknown (empty)

export type YearBounds = {
  /** Earliest possible year, or null when the start is open or unknown. */
  start: number | null;
  /** Latest possible year, or null when the end is open or unknown. */
  end: number | null;
  approximate: boolean;
  uncertain: boolean;
};

type Point = {
  start: number;
  end: number;
  approximate: boolean;
  uncertain: boolean;
  unspecified: boolean;
};

const POINT =
  /^(?<sign>-?)(?<year>[0-9X]{4})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?(?<qualifier>[?~%])?$/u;

function parsePoint(text: string): Point | null {
  const match = POINT.exec(text);
  if (match?.groups === undefined) return null;
  const { sign, year, month, day, qualifier } = match.groups;
  if (year === undefined) return null;
  // Unspecified digits must be trailing: 02XX and 019X, not 0X63.
  if (!/^\d+X*$/u.test(year) || year === 'XXXX') return null;
  if (year.includes('X') && month !== undefined) return null;
  if (month !== undefined && (Number(month) < 1 || Number(month) > 12)) return null;
  if (day !== undefined && (Number(day) < 1 || Number(day) > 31)) return null;

  const low = Number(year.replaceAll('X', '0'));
  const high = Number(year.replaceAll('X', '9'));
  const negative = sign === '-';
  if (negative && low === 0 && high === 0) return null; // -0000 is not a year
  return {
    start: negative ? -high : low,
    end: negative ? -low : high,
    approximate: qualifier === '~' || qualifier === '%',
    uncertain: qualifier === '?' || qualifier === '%',
    unspecified: year.includes('X'),
  };
}

function isOpenOrUnknown(part: string): boolean {
  return part === '' || part === '..';
}

/** Parses an EDTF string into year bounds, or returns null if it is not supported EDTF. */
export function parseEdtf(text: string): YearBounds | null {
  const value = text.trim();
  if (value === '') return null;

  if (!value.includes('/')) {
    const point = parsePoint(value);
    if (point === null) return null;
    return {
      start: point.start,
      end: point.end,
      approximate: point.approximate,
      uncertain: point.uncertain,
    };
  }

  const parts = value.split('/');
  if (parts.length !== 2) return null;
  const [from = '', to = ''] = parts;
  if (isOpenOrUnknown(from) && isOpenOrUnknown(to)) return null;

  const first = isOpenOrUnknown(from) ? null : parsePoint(from);
  const last = isOpenOrUnknown(to) ? null : parsePoint(to);
  if (first === null && !isOpenOrUnknown(from)) return null;
  if (last === null && !isOpenOrUnknown(to)) return null;
  if (first !== null && last !== null && first.start > last.end) return null;

  return {
    start: first?.start ?? null,
    end: last?.end ?? null,
    approximate: (first?.approximate ?? false) || (last?.approximate ?? false),
    uncertain: (first?.uncertain ?? false) || (last?.uncertain ?? false),
  };
}

/** True when the string is EDTF this module can read. */
export function isEdtf(text: string): boolean {
  return parseEdtf(text) !== null;
}

/** An astronomical year as display text: -569 is "570 BCE", 263 is "263 CE". */
export function formatYear(year: number): string {
  return year <= 0 ? `${1 - year} BCE` : `${year} CE`;
}

function era(year: number): 'BCE' | 'CE' {
  return year <= 0 ? 'BCE' : 'CE';
}

function formatRange(start: number, end: number): string {
  if (start === end) return formatYear(start);
  if (era(start) === era(end)) {
    const from = start <= 0 ? 1 - start : start;
    const to = end <= 0 ? 1 - end : end;
    return `${from}–${to} ${era(start)}`;
  }
  return `${formatYear(start)} – ${formatYear(end)}`;
}

function formatPoint(point: Point): string {
  const text = point.unspecified ? formatRange(point.start, point.end) : formatYear(point.start);
  return `${point.approximate ? 'c. ' : ''}${text}${point.uncertain ? '?' : ''}`;
}

/**
 * EDTF as reader-facing text: "c. 570 BCE", "263–268 CE", "500–599 CE", "from 263 CE".
 * Returns the input unchanged if it cannot be parsed.
 */
export function formatEdtf(text: string): string {
  const value = text.trim();
  if (parseEdtf(value) === null) return text;

  if (!value.includes('/')) {
    const point = parsePoint(value);
    return point === null ? text : formatPoint(point);
  }

  const [from = '', to = ''] = value.split('/');
  const first = from === '' || from === '..' ? null : parsePoint(from);
  const last = to === '' || to === '..' ? null : parsePoint(to);
  if (first === null && last !== null) return `until ${formatPoint(last)}`;
  if (first !== null && last === null) return `from ${formatPoint(first)}`;
  if (first === null || last === null) return text;

  const plain = !first.approximate && !first.uncertain && !last.approximate && !last.uncertain;
  if (plain && !first.unspecified && !last.unspecified) return formatRange(first.start, last.end);
  return `${formatPoint(first)} – ${formatPoint(last)}`;
}

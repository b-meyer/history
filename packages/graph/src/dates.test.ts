import { describe, expect, it } from 'vite-plus/test';
import { formatEdtf, formatYear, parseEdtf } from './dates.ts';

describe('parseEdtf', () => {
  it('reads a CE year', () => {
    expect(parseEdtf('0263')).toEqual({
      start: 263,
      end: 263,
      approximate: false,
      uncertain: false,
    });
  });

  it('reads a BCE year as an astronomical year', () => {
    expect(parseEdtf('-0569')).toMatchObject({ start: -569, end: -569 });
  });

  it('reduces a month or day to its year', () => {
    expect(parseEdtf('0263-05')).toMatchObject({ start: 263, end: 263 });
    expect(parseEdtf('0263-05-01')).toMatchObject({ start: 263, end: 263 });
  });

  it('reads qualifiers', () => {
    expect(parseEdtf('-0569~')).toMatchObject({ approximate: true, uncertain: false });
    expect(parseEdtf('0263?')).toMatchObject({ approximate: false, uncertain: true });
    expect(parseEdtf('0263%')).toMatchObject({ approximate: true, uncertain: true });
  });

  it('widens unspecified digits to a century or decade', () => {
    expect(parseEdtf('02XX')).toMatchObject({ start: 200, end: 299 });
    expect(parseEdtf('019X')).toMatchObject({ start: 190, end: 199 });
    expect(parseEdtf('-05XX')).toMatchObject({ start: -599, end: -500 });
  });

  it('reads intervals, including open and unknown ends', () => {
    expect(parseEdtf('0263/0268')).toMatchObject({ start: 263, end: 268 });
    expect(parseEdtf('-0569~/-0495')).toMatchObject({ start: -569, end: -495, approximate: true });
    expect(parseEdtf('0263/..')).toMatchObject({ start: 263, end: null });
    expect(parseEdtf('/0268')).toMatchObject({ start: null, end: 268 });
  });

  it('rejects what it cannot read', () => {
    for (const bad of [
      '',
      '263',
      '-0000',
      '0X63',
      'XXXX',
      '02XX-05',
      '0263-13',
      '0268/0263',
      '../..',
      'c. 570 BCE',
      '0263/0264/0265',
    ]) {
      expect(parseEdtf(bad), bad).toBeNull();
    }
  });
});

describe('formatYear', () => {
  it('writes BCE and CE years', () => {
    expect(formatYear(-569)).toBe('570 BCE');
    expect(formatYear(0)).toBe('1 BCE');
    expect(formatYear(1)).toBe('1 CE');
  });
});

describe('formatEdtf', () => {
  it('writes points with their qualifiers', () => {
    expect(formatEdtf('-0569~')).toBe('c. 570 BCE');
    expect(formatEdtf('0263?')).toBe('263 CE?');
    expect(formatEdtf('02XX')).toBe('200–299 CE');
    expect(formatEdtf('-05XX')).toBe('600–501 BCE');
  });

  it('writes intervals', () => {
    expect(formatEdtf('0263/0268')).toBe('263–268 CE');
    expect(formatEdtf('-0030/0020')).toBe('31 BCE – 20 CE');
    expect(formatEdtf('-0569~/-0495')).toBe('c. 570 BCE – 496 BCE');
    expect(formatEdtf('0263/..')).toBe('from 263 CE');
    expect(formatEdtf('/0268')).toBe('until 268 CE');
  });

  it('returns unreadable input unchanged', () => {
    expect(formatEdtf('sometime')).toBe('sometime');
  });
});

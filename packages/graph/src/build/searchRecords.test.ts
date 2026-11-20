import { describe, expect, it } from 'vite-plus/test';
import { spanText } from './searchRecords.ts';

describe('spanText', () => {
  it('formats a record span as reader-facing text', () => {
    expect(spanText({ start: null, end: null })).toBe('');
    expect(spanText({ start: -569, end: -569 })).toBe('570 BCE');
    expect(spanText({ start: -569, end: -494 })).toBe('570–495 BCE');
    expect(spanText({ start: 204, end: null })).toBe('204 CE');
    expect(spanText({ start: null, end: 204 })).toBe('until 204 CE');
  });
});

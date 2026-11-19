import { describe, expect, it } from 'vite-plus/test';
import { leadsPlugin } from '../leadsPlugin.ts';

describe('leadsPlugin', () => {
  const apply = leadsPlugin().apply;
  const applies = (command: 'serve' | 'build', mode: string) =>
    typeof apply === 'function' && apply({}, { command, mode });

  it('applies only to the dev server in leads mode', () => {
    expect(applies('serve', 'leads')).toBe(true);
    expect(applies('serve', 'development')).toBe(false);
    expect(applies('build', 'leads')).toBe(false);
    expect(applies('build', 'production')).toBe(false);
  });
});

import { describe, expect, it } from 'vite-plus/test';
import { tailwindSourcesPlugin } from './tailwindSources.ts';

type Transform = (code: string, id: string) => { code: string } | undefined;

function transform(sources: string[]): Transform {
  return tailwindSourcesPlugin(sources).transform as unknown as Transform;
}

describe('tailwindSourcesPlugin', () => {
  it('appends an @source line per folder to the Tailwind entry', () => {
    const result = transform(['C:\\repo\\packages\\map\\src'])(
      "@import 'tailwindcss';",
      'C:/repo/packages/qdocs/src/styles/entry.css',
    );
    expect(result?.code).toBe('@import \'tailwindcss\';\n@source "C:/repo/packages/map/src";\n');
  });

  it('leaves other files and an empty list alone', () => {
    expect(transform(['/x'])('a {}', '/repo/src/other.css')).toBeUndefined();
    expect(transform([])('a {}', '/repo/styles/entry.css')).toBeUndefined();
  });

  it('runs before Tailwind', () => {
    expect(tailwindSourcesPlugin([]).enforce).toBe('pre');
  });
});

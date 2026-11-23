import { describe, expect, it } from 'vite-plus/test';
import type { QDocsConfig } from './config';
import { clientConfig } from './config';
import { buildPrePaintScript } from './plugin';

const config: QDocsConfig = { title: 'T', sidebar: [], prePaintScript: 'window.__extra=1;' };

describe('prePaintScript', () => {
  it('is appended after the theme code in the pre-paint script', () => {
    const script = buildPrePaintScript(config);
    expect(script.endsWith('window.__extra=1;')).toBe(true);
    expect(script.indexOf("localStorage.getItem('theme')")).toBeLessThan(
      script.indexOf('window.__extra'),
    );
  });

  it('adds nothing when unset', () => {
    expect(buildPrePaintScript({ title: 'T', sidebar: [] })).not.toContain('__extra');
    expect(buildPrePaintScript(null)).not.toContain('__extra');
  });

  it('stays out of the client config', () => {
    expect(clientConfig(config)).not.toHaveProperty('prePaintScript');
  });
});

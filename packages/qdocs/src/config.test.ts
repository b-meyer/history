import { describe, expect, it } from 'vite-plus/test';
import { clientConfig, type QDocsConfig } from './config';

describe('clientConfig', () => {
  it('drops routeParams and keeps everything else', () => {
    const config: QDocsConfig = {
      title: 'T',
      sidebar: [],
      setup: './src/setup.ts',
      routeParams: { '/e/:id': ['a', 'b'] },
    };
    const result = clientConfig(config);
    expect(result).not.toHaveProperty('routeParams');
    expect(result).toEqual({ title: 'T', sidebar: [], setup: './src/setup.ts' });
    expect(config.routeParams).toEqual({ '/e/:id': ['a', 'b'] });
  });
});

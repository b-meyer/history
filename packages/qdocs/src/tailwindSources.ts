import type { Plugin } from 'vite';

const ENTRY_CSS = /[\\/]styles[\\/]entry\.css(?:\?.*)?$/u;

/**
 * Adds `@source` lines to the framework's Tailwind entry, so Tailwind scans folders its automatic
 * detection skips: workspace packages outside the app root. Runs before Tailwind's own transform.
 */
export function tailwindSourcesPlugin(sources: readonly string[]): Plugin {
  return {
    name: 'qdocs:tailwind-sources',
    enforce: 'pre',
    transform(code, id) {
      if (sources.length === 0 || !ENTRY_CSS.test(id)) return;
      const lines = sources.map(
        (source) => `@source ${JSON.stringify(source.replaceAll('\\', '/'))};`,
      );
      return { code: `${code}\n${lines.join('\n')}\n`, map: null };
    },
  };
}

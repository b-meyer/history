import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    pool: 'threads',
    clearMocks: true,
    restoreMocks: true,
  },
  run: {
    tasks: {
      test: {
        command: 'vp test',
      },
      typecheck: {
        command: 'tsc -p tsconfig.json',
      },
    },
  },
});

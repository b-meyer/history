import { defineConfig } from 'qdocs/vite';

export default defineConfig({
  title: 'History',
  description: 'A map and wiki of how ideas and traditions moved across time and place.',
  base: '/',
  branding: {
    siteTitle: 'History',
  },
  markdown: {
    mermaid: true,
  },
  sidebar: [{ path: 'index', title: 'Home' }],
  server: { port: 48460 },
  preview: { port: 48460 },
});

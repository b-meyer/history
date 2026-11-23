import { describe, expect, it } from 'vite-plus/test';
import { createSSRApp, h, type Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { renderToString } from 'vue/server-renderer';
import RecordPage from './pages/e/[id].vue';
import { records } from './records.ts';

const passthrough: Component = {
  render: (ctx: { $slots: { default?: () => unknown } }) =>
    h('div', ctx.$slots.default?.() as never),
};

async function render(id: string): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/e/:id', component: RecordPage }],
  });
  await router.push(`/e/${id}`);
  const app = createSSRApp(RecordPage);
  app.component('PageLayout', passthrough);
  app.use(router);
  return renderToString(app);
}

function record(id: string, article?: string): void {
  records.set(id, {
    id,
    type: 'person',
    names: { en: id },
    span: { start: null, end: null },
    claims: [],
    sources: {},
    ...(article === undefined ? {} : { article }),
  });
}

describe('record page wiki link', () => {
  it('links to the home article when one names the entity', async () => {
    record('porphyry', '/wiki/platonism/Porphyry');
    const html = await render('porphyry');
    expect(html).toContain('href="/wiki/platonism/Porphyry"');
    expect(html).toMatch(/<a [^>]*href="\/wiki\/platonism\/Porphyry"[^>]*>Wiki<\/a>/u);
  });

  it('has no wiki link without an article', async () => {
    record('plotinus');
    const html = await render('plotinus');
    expect(html).not.toContain('>Wiki<');
  });
});

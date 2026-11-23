import type { MapData, MapEntity } from 'graph';
import EntityPanel from 'map/EntityPanel.vue';
import { describe, expect, it } from 'vite-plus/test';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';

function entity(fields: Partial<MapEntity> = {}): MapEntity {
  return {
    id: 'porphyry',
    type: 'person',
    name: 'Porphyry',
    notability: 1,
    start: 233,
    end: 305,
    ...fields,
  };
}

function render(selected: MapEntity): Promise<string> {
  const data = { places: {}, entities: [selected], claims: [], stays: [], links: [] } as MapData;
  const app = createSSRApp({
    render: () =>
      h(EntityPanel, { selection: { kind: 'entity', entity: selected }, data, vocab: null }),
  });
  app.component('RouterLink', {
    props: ['to'],
    render(this: { to: string; $slots: { default?: () => never } }) {
      return h('a', { href: this.to }, this.$slots.default?.());
    },
  });
  return renderToString(app);
}

describe('EntityPanel wiki link', () => {
  it('links to the article when the entity has one', async () => {
    const html = await render(entity({ article: '/wiki/platonism/Porphyry' }));
    expect(html).toMatch(/<a href="\/wiki\/platonism\/Porphyry">Wiki<\/a>/u);
  });

  it('has no wiki link without an article', async () => {
    expect(await render(entity())).not.toContain('>Wiki<');
  });
});

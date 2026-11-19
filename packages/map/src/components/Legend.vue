<script setup lang="ts">
import type { VocabTerms } from 'graph';
import { computed } from 'vue';
import { DASH, linkColor, palette, rgbaCss, type Theme } from '../style.ts';

const props = defineProps<{ vocab: VocabTerms | null; theme: Theme; leads?: boolean }>();

const LINE_WIDTH = 3;

/** SVG stroke-dasharray for a confidence; PathStyleExtension counts in half line widths. */
function dashArray(confidence: 'A' | 'B' | 'C'): string | undefined {
  const [dash, gap] = DASH[confidence];
  if (dash === 0) return undefined;
  const unit = LINE_WIDTH / 2;
  return `${dash * unit} ${gap * unit}`;
}

const rows = computed(() =>
  (['A', 'B', 'C'] as const).map((confidence) => ({
    confidence,
    label: props.vocab?.confidence[confidence].label ?? confidence,
    meaning: props.vocab?.confidence[confidence].meaning ?? '',
    dash: dashArray(confidence),
  })),
);

const lead = computed(() => rgbaCss(palette(props.theme).lead));
const plain = computed(() => rgbaCss(linkColor('primary', props.theme)));
const tradition = computed(() => ({
  color: rgbaCss(palette(props.theme).tradition),
  label: props.vocab?.basis.tradition.label ?? 'Tradition',
  meaning: props.vocab?.basis.tradition.meaning ?? '',
}));
</script>

<template>
  <section class="text-sm" aria-labelledby="map-legend">
    <h2 id="map-legend" class="m-0 mb-1 text-sm font-semibold">Legend</h2>
    <ul class="m-0 list-none space-y-1 p-0">
      <li v-for="row in rows" :key="row.confidence" class="flex items-start gap-2">
        <svg class="mt-1.5 shrink-0" width="36" height="6" aria-hidden="true">
          <line
            x1="0"
            y1="3"
            x2="36"
            y2="3"
            :stroke="plain"
            :stroke-width="LINE_WIDTH"
            :stroke-dasharray="row.dash"
          />
        </svg>
        <span
          ><span class="font-medium">{{ row.confidence }} · {{ row.label }}</span
          ><span v-if="row.meaning" class="block text-gray-600">{{ row.meaning }}</span></span
        >
      </li>
      <li class="flex items-start gap-2">
        <svg class="mt-1.5 shrink-0" width="36" height="6" aria-hidden="true">
          <line x1="0" y1="3" x2="36" y2="3" :stroke="tradition.color" :stroke-width="LINE_WIDTH" />
        </svg>
        <span
          ><span class="font-medium">{{ tradition.label }}</span
          ><span v-if="tradition.meaning" class="block text-gray-600">{{
            tradition.meaning
          }}</span></span
        >
      </li>
      <li class="flex items-center gap-2">
        <svg class="shrink-0" width="36" height="12" aria-hidden="true">
          <circle cx="12" cy="6" r="4.5" :fill="plain" />
          <circle cx="27" cy="6" r="4" fill="none" :stroke="plain" stroke-width="1.5" />
        </svg>
        <span>Filled: secure or probable. Hollow: contested.</span>
      </li>
      <li v-if="leads" class="flex items-center gap-2">
        <svg class="shrink-0" width="36" height="12" aria-hidden="true">
          <circle cx="12" cy="6" r="4" fill="none" :stroke="lead" stroke-width="1.5" />
          <line
            x1="20"
            y1="6"
            x2="36"
            y2="6"
            :stroke="lead"
            stroke-width="1.5"
            stroke-dasharray="1.5 4"
          />
        </svg>
        <span>Lead: unaudited Wikidata import, dev:leads only</span>
      </li>
    </ul>
    <p class="m-0 mt-2 text-xs text-gray-500">
      Basemap: Natural Earth · Places:
      <a href="https://pleiades.stoa.org/" class="underline" target="_blank" rel="noopener"
        >Pleiades</a
      >
      (CC BY 3.0)
    </p>
  </section>
</template>

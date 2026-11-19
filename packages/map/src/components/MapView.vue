<script setup lang="ts">
import { Deck, MapView as DeckMapView, type PickingInfo } from '@deck.gl/core';
import type { MapData, MapStay, VocabTerms } from 'graph';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watchEffect,
} from 'vue';
import { arcPath } from '../arc.ts';
import { useMapUrl } from '../composables/useMapUrl.ts';
import { labelData, stayAt, visibleLinks, visibleStays, type Selection } from '../data.ts';
import { BASEMAP, buildLayers, type Basemap, type LinkPath } from '../layers.ts';
import { currentTheme, palette, rgbaCss, type Theme } from '../style.ts';
import { DEFAULT_WINDOW } from '../timeFilter.ts';
import EntityPanel from './EntityPanel.vue';
import LayerPanel from './LayerPanel.vue';
import Legend from './Legend.vue';
import TimeSlider from './TimeSlider.vue';

const props = defineProps<{ base: string }>();

const state = useMapUrl();
const span = ref(DEFAULT_WINDOW);
const playing = ref(false);
const theme = ref<Theme>('light');
const data = shallowRef<MapData | null>(null);
const vocab = shallowRef<VocabTerms | null>(null);
const basemap = shallowRef<Basemap | null>(null);
const failed = ref(false);
const selection = shallowRef<Selection | null>(null);

const container = useTemplateRef<HTMLDivElement>('container');
let deck: Deck<DeckMapView> | undefined;
let observer: MutationObserver | undefined;

// Layer toggles filter on the CPU, only when they change; time filters on the GPU.
const stays = computed(() => visibleStays(data.value?.stays ?? [], state.layers));
const labels = computed(() => labelData(stays.value));
const links = computed<LinkPath[]>(() =>
  visibleLinks(data.value?.links ?? [], state.layers).map((link) => ({
    link,
    path: arcPath(link.from, link.to),
  })),
);
const focus = computed(() =>
  selection.value?.kind === 'stay' ? selection.value.stay.entity : null,
);
const background = computed(() => rgbaCss(palette(theme.value).background));

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${props.base}${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

/** Opens the panel on the URL's focus and centres the view on it. */
function openFocus(map: MapData): void {
  const id = state.focus;
  if (id === null) return;
  const stay = stayAt(map.stays, id, state.t);
  if (stay === undefined) {
    const entity = map.entities.find((e) => e.id === id);
    if (entity !== undefined) selection.value = { kind: 'entity', entity };
    return;
  }
  selection.value = { kind: 'stay', stay };
  const [longitude, latitude] = stay.coords;
  const zoom = Math.max(state.view.zoom, 5);
  deck?.setProps({ initialViewState: { longitude, latitude, zoom, transitionDuration: 600 } });
}

async function load(): Promise<void> {
  try {
    const [map, terms, ...shapes] = await Promise.all([
      fetchJson('data/map.json'),
      fetchJson('data/vocab.json'),
      ...BASEMAP.map((name) => fetchJson(`basemap/${name}.json`)),
    ]);
    data.value = map as MapData;
    vocab.value = terms as VocabTerms;
    basemap.value = Object.fromEntries(
      BASEMAP.map((name, index) => [name, shapes[index]]),
    ) as Basemap;
    openFocus(data.value);
  } catch (error) {
    failed.value = true;
    console.error('map: could not load its data', error);
  }
}

function closePanel(): void {
  selection.value = null;
  state.focus = null;
}

function onClick(info: PickingInfo): void {
  playing.value = false;
  const id = info.layer?.id;
  if (id === 'stays' && info.object !== undefined) {
    const stay = info.object as MapStay;
    selection.value = { kind: 'stay', stay };
    state.focus = stay.entity;
  } else if (id === 'links' && info.object !== undefined) {
    selection.value = { kind: 'link', link: (info.object as LinkPath).link };
    state.focus = null;
  } else {
    closePanel();
  }
}

function layers() {
  return buildLayers({
    theme: theme.value,
    t: state.t,
    window: span.value,
    focus: focus.value,
    basemap: basemap.value,
    stays: stays.value,
    labels: labels.value,
    links: links.value,
  });
}

watchEffect(() => {
  const next = layers();
  deck?.setProps({ layers: next });
});

onMounted(() => {
  theme.value = currentTheme();
  observer = new MutationObserver(() => {
    theme.value = currentTheme();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  if (container.value === null) return;
  deck = new Deck({
    parent: container.value,
    views: new DeckMapView({ repeat: false }),
    controller: true,
    initialViewState: { ...state.view },
    layers: layers(),
    onClick,
    getCursor: ({ isDragging, isHovering }) =>
      isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab',
    onViewStateChange: ({ viewState }) => {
      const { longitude, latitude, zoom } = viewState;
      state.view = { longitude, latitude, zoom };
    },
  });
  void load();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  deck?.finalize();
  deck = undefined;
});
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div
      ref="container"
      class="absolute inset-0"
      :style="{ background }"
      role="application"
      aria-label="Map"
    ></div>

    <div
      class="absolute top-2 right-2 left-2 rounded-lg bg-white/90 px-3 py-2 shadow dark:bg-gray-125/90"
    >
      <TimeSlider v-model:year="state.t" v-model:window="span" v-model:playing="playing" />
    </div>

    <details
      class="absolute top-20 right-2 rounded-lg bg-white/90 px-3 py-2 shadow dark:bg-gray-125/90"
      open
    >
      <summary class="cursor-pointer text-sm font-semibold">Layers</summary>
      <LayerPanel v-model="state.layers" />
    </details>

    <div
      class="absolute bottom-2 left-2 max-w-xs rounded-lg bg-white/90 px-3 py-2 shadow dark:bg-gray-125/90"
    >
      <Legend :vocab="vocab" :theme="theme" />
    </div>

    <div
      v-if="selection && data"
      class="absolute right-2 bottom-2 w-72 max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-3 py-2 shadow dark:bg-gray-125/95"
    >
      <EntityPanel :selection="selection" :data="data" :vocab="vocab" @close="closePanel" />
    </div>

    <p
      v-if="failed"
      class="absolute inset-x-0 top-1/2 m-0 text-center text-sm font-medium"
      role="alert"
    >
      The map data could not be loaded.
    </p>
  </div>
</template>

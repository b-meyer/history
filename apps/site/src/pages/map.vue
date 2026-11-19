<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { onMounted, shallowRef, type Component } from 'vue';

useHead({
  title: 'Map',
  meta: [
    {
      name: 'description',
      content: 'A map of the graph over time: people, works, schools and the links between them.',
    },
  ],
});

// The map runs only in the browser. Pre-rendering writes this shell, and deck.gl loads in its own
// chunk once the page mounts.
const view = shallowRef<Component | null>(null);
const base = import.meta.env.BASE_URL;

onMounted(async () => {
  const { MapView } = await import('map');
  view.value = MapView;
});
</script>

<template>
  <div class="relative h-[calc(100vh-var(--header-h,4rem))] w-full">
    <component :is="view" v-if="view" :base="base" />
    <p v-else class="m-0 p-4 text-sm text-gray-600">Loading map…</p>
  </div>
</template>

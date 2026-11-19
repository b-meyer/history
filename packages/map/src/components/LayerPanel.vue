<script setup lang="ts">
import type { LayerId } from '../url.ts';

const layers = defineModel<LayerId[]>({ required: true });

const TOGGLES: { id: LayerId; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'works', label: 'Works' },
  { id: 'schools', label: 'Schools and traditions' },
  { id: 'institutions', label: 'Institutions' },
  { id: 'links', label: 'Teaching and influence' },
  { id: 'events', label: 'Events' },
  { id: 'contested', label: 'Contested claims' },
  { id: 'tradition', label: 'Tradition accounts' },
];

function toggle(id: LayerId, on: boolean): void {
  const next = new Set(layers.value);
  if (on) next.add(id);
  else next.delete(id);
  layers.value = TOGGLES.map((t) => t.id).filter((layer) => next.has(layer));
}
</script>

<template>
  <fieldset class="m-0 border-0 p-0 text-sm">
    <legend class="sr-only">Layers</legend>
    <label v-for="item in TOGGLES" :key="item.id" class="flex items-center gap-2 py-0.5">
      <input
        type="checkbox"
        :checked="layers.includes(item.id)"
        @change="toggle(item.id, ($event.target as HTMLInputElement).checked)"
      />
      {{ item.label }}
    </label>
  </fieldset>
</template>

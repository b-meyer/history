<script setup lang="ts">
import type { MapData, VocabTerms } from 'graph';
import { formatYear } from 'graph/dates';
import { computed } from 'vue';
import type { Selection } from '../data.ts';

const props = defineProps<{
  selection: Selection;
  data: MapData;
  vocab: VocabTerms | null;
}>();
defineEmits<{ close: [] }>();

function years(start: number | null, end: number | null, approximate = false): string {
  if (start === null && end === null) return '';
  const c = approximate ? 'c. ' : '';
  if (start === end || end === null) return `${c}${formatYear(start ?? 0)}`;
  if (start === null) return `until ${formatYear(end)}`;
  return `${c}${formatYear(start)} – ${formatYear(end)}`;
}

const names = computed(() => new Map(props.data.entities.map((e) => [e.id, e.name])));
const nameOf = (id: string): string => names.value.get(id) ?? id;

const claim = computed(() => {
  const { selection } = props;
  if (selection.kind === 'entity') return null;
  const { confidence, basis } = selection.kind === 'stay' ? selection.stay : selection.link;
  return {
    confidence,
    confidenceLabel: props.vocab?.confidence[confidence].label ?? confidence,
    confidenceMeaning: props.vocab?.confidence[confidence].meaning,
    basisLabel: props.vocab?.basis[basis].label ?? basis,
    basisMeaning: props.vocab?.basis[basis].meaning,
    tradition: basis === 'tradition',
  };
});
</script>

<template>
  <section class="text-sm" aria-labelledby="map-panel-title">
    <div class="flex items-start justify-between gap-2">
      <h2 id="map-panel-title" class="m-0 text-base font-semibold">
        <template v-if="selection.kind === 'stay'">{{ selection.stay.name }}</template>
        <template v-else-if="selection.kind === 'entity'">{{ selection.entity.name }}</template>
        <template v-else>
          {{ nameOf(selection.link.subject) }} · {{ selection.link.label }}
          {{ nameOf(selection.link.object) }}
        </template>
      </h2>
      <button
        type="button"
        class="rounded px-1 text-gray-500 hover:text-gray-800"
        aria-label="Close panel"
        @click="$emit('close')"
      >
        ×
      </button>
    </div>

    <template v-if="selection.kind === 'stay'">
      <p class="m-0 mt-1">
        {{ years(selection.stay.start, selection.stay.end, selection.stay.approximate) }}
        <template v-if="data.places[selection.stay.place]">
          · {{ data.places[selection.stay.place]?.name }}
        </template>
      </p>
      <p class="m-0 mt-2">
        <RouterLink :to="`/e/${selection.stay.entity}`">Open record</RouterLink>
      </p>
    </template>

    <template v-else-if="selection.kind === 'entity'">
      <p class="m-0 mt-1">
        {{ years(selection.entity.start, selection.entity.end) || 'No dated place on the map.' }}
      </p>
      <p class="m-0 mt-2">
        <RouterLink :to="`/e/${selection.entity.id}`">Open record</RouterLink>
      </p>
    </template>

    <template v-else>
      <p class="m-0 mt-1">{{ years(selection.link.start, selection.link.end) }}</p>
      <ul class="m-0 mt-2 list-none space-y-0.5 p-0">
        <li>
          <RouterLink :to="`/e/${selection.link.subject}`">{{
            nameOf(selection.link.subject)
          }}</RouterLink>
        </li>
        <li>
          <RouterLink :to="`/e/${selection.link.object}`">{{
            nameOf(selection.link.object)
          }}</RouterLink>
        </li>
      </ul>
    </template>

    <p v-if="claim" class="m-0 mt-2 text-gray-600">
      <span :title="claim.confidenceMeaning"
        >{{ claim.confidence }} · {{ claim.confidenceLabel }}</span
      >
      · <span :title="claim.basisMeaning">{{ claim.basisLabel }}</span>
      <span v-if="claim.tradition"> · a tradition's own account</span>
    </p>
  </section>
</template>

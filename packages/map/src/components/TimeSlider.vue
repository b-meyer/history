<script setup lang="ts">
import { formatYear } from 'graph/dates';
import { onBeforeUnmount, watch } from 'vue';
import { WINDOW_MAX, WINDOW_MIN } from '../timeFilter.ts';
import { YEAR_MAX, YEAR_MIN } from '../url.ts';

const year = defineModel<number>('year', { required: true });
const width = defineModel<number>('window', { required: true });
const playing = defineModel<boolean>('playing', { required: true });

const SPEEDS = [10, 25, 50, 100] as const;
const speed = defineModel<number>('speed', { default: 25 });

let frame: number | undefined;
let last: number | undefined;
// The slider holds whole years; the fraction carries between frames so slow speeds still move.
let carry = 0;

function step(now: number): void {
  if (last !== undefined) {
    carry += ((now - last) / 1000) * speed.value;
    const whole = Math.floor(carry);
    if (whole > 0) {
      carry -= whole;
      year.value = Math.min(YEAR_MAX, year.value + whole);
    }
  }
  last = now;
  if (year.value >= YEAR_MAX) {
    playing.value = false;
    return;
  }
  frame = requestAnimationFrame(step);
}

function stop(): void {
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  last = undefined;
  carry = 0;
}

watch(
  playing,
  (on) => {
    stop();
    if (on) {
      if (year.value >= YEAR_MAX) year.value = YEAR_MIN;
      frame = requestAnimationFrame(step);
    }
  },
  { immediate: true },
);

onBeforeUnmount(stop);

function onYear(event: Event): void {
  playing.value = false;
  year.value = Number((event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
    <button
      type="button"
      class="rounded border border-gray-300 px-3 py-1 font-medium hover:bg-gray-100"
      :aria-pressed="playing"
      @click="playing = !playing"
    >
      {{ playing ? 'Pause' : 'Play' }}
    </button>
    <label class="flex min-w-48 flex-1 items-center gap-3">
      <span class="sr-only">Year</span>
      <input
        class="w-full"
        type="range"
        :min="YEAR_MIN"
        :max="YEAR_MAX"
        step="1"
        :value="year"
        aria-describedby="map-year"
        @input="onYear"
      />
    </label>
    <output id="map-year" class="w-24 font-semibold tabular-nums" aria-live="off">{{
      formatYear(year)
    }}</output>
    <label class="flex items-center gap-2">
      Window
      <input v-model.number="width" type="range" :min="WINDOW_MIN" :max="WINDOW_MAX" step="10" />
      <span class="w-16 tabular-nums">{{ width }} yrs</span>
    </label>
    <label class="flex items-center gap-2">
      Speed
      <select
        v-model.number="speed"
        class="rounded border border-gray-300 bg-transparent px-1 py-0.5"
      >
        <option v-for="option in SPEEDS" :key="option" :value="option">{{ option }} yrs/s</option>
      </select>
    </label>
  </div>
</template>

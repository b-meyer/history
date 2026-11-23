<script setup lang="ts">
import { onMounted } from 'vue';
import { useReaderSettings } from '../composables/useReaderSettings.ts';

const { aiProse, setAiProse, syncFromStorage } = useReaderSettings();
onMounted(syncFromStorage);
</script>

<template>
  <div class="flex items-center gap-2 text-sm" role="group" aria-label="AI prose">
    <span class="text-gray-600">AI prose</span>
    <span
      v-if="!aiProse"
      class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
      data-testid="ai-badge"
      >Off</span
    >
    <span class="inline-flex overflow-hidden rounded-md border border-gray-200">
      <button
        type="button"
        class="px-2 py-1"
        :class="aiProse ? 'bg-primary-50 font-medium text-gray-900' : 'text-gray-600'"
        :aria-pressed="aiProse"
        @click="setAiProse(true)"
      >
        On
      </button>
      <button
        type="button"
        class="px-2 py-1"
        :class="!aiProse ? 'bg-primary-50 font-medium text-gray-900' : 'text-gray-600'"
        :aria-pressed="!aiProse"
        @click="setAiProse(false)"
      >
        Off
      </button>
    </span>
  </div>
</template>

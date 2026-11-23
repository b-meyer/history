<script setup lang="ts">
import { useReaderSettings } from '../composables/useReaderSettings.ts';

// Placed first in every wiki page's body. It stays hidden until <html data-ai="off">, when the CSS
// in reader.css shows it and hides the rest of the article, so the prose never flashes.
defineProps<{ entity?: string }>();
const { setAiProse } = useReaderSettings();
</script>

<template>
  <div class="ai-off-notice not-prose my-4 rounded-lg border border-gray-200 p-4 text-sm">
    <p class="m-0 font-medium">AI prose is off.</p>
    <p class="m-0 mt-1 text-gray-600">
      <template v-if="entity">
        <RouterLink :to="`/e/${entity}`">Open the record</RouterLink> for dates, places, links and
        sources, or
      </template>
      <template v-else>You can</template>
      <button type="button" class="underline" @click="setAiProse(true)">turn AI prose on</button>
      to read this page.
    </p>
  </div>
</template>

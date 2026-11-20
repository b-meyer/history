<script setup lang="ts">
import type { ReadingEntry } from 'graph';
import { computed } from 'vue';
import { reading } from '@/records';

const frontmatter = {
  title: 'Reading List',
  description: 'Sources worth reading on the subjects in the graph, with notes on each.',
};

const groups = computed(() => {
  const entries = reading.value ?? [];
  return (
    [
      ['Primary Sources', entries.filter((entry) => entry.kind === 'primary')],
      ['Secondary Sources', entries.filter((entry) => entry.kind === 'secondary')],
    ] as const
  ).filter(([, list]) => list.length > 0);
});

function people(entry: ReadingEntry): string {
  const parts: string[] = [];
  if (entry.authors?.length) parts.push(entry.authors.join(', '));
  if (entry.translators?.length) parts.push(`trans. ${entry.translators.join(', ')}`);
  if (entry.editors?.length) parts.push(`ed. ${entry.editors.join(', ')}`);
  return parts.join('; ');
}

function edition(entry: ReadingEntry): string {
  return [entry.edition, entry.publisher, entry.published].filter(Boolean).join(', ');
}
</script>

<template>
  <PageLayout :frontmatter="frontmatter">
    <h1>Reading List</h1>
    <p v-if="groups.length === 0">No sources are on the reading list yet.</p>
    <section v-for="[heading, list] in groups" :key="heading">
      <h2>{{ heading }}</h2>
      <ul>
        <li v-for="entry in list" :key="entry.key">
          <a v-if="entry.url" :href="entry.url" rel="noopener noreferrer">{{ entry.title }}</a>
          <cite v-else>{{ entry.title }}</cite>
          <span v-if="people(entry)">, {{ people(entry) }}</span>
          <span v-if="edition(entry)">, {{ edition(entry) }}</span>
          <span v-if="entry.writtenText">, written {{ entry.writtenText }}</span>
          <p v-if="entry.annotation" class="my-1 text-gray-700">{{ entry.annotation }}</p>
          <p v-if="entry.records.length > 0" class="my-1 text-sm text-gray-600">
            Cited on
            <template v-for="(record, index) in entry.records" :key="record.id">
              <span v-if="index > 0">, </span>
              <RouterLink :to="`/e/${record.id}`">{{ record.name }}</RouterLink>
            </template>
          </p>
        </li>
      </ul>
    </section>
  </PageLayout>
</template>

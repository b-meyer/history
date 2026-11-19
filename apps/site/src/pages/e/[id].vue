<script setup lang="ts">
import type { RecordClaim, RecordSource } from 'graph';
import { formatYear } from 'graph/dates';
import { formatYearParam } from 'map/url';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { records, vocab } from '@/records';

const route = useRoute();
const id = computed(() => {
  const param = route.params['id'];
  return typeof param === 'string' ? param : '';
});
const record = computed(() => records.get(id.value));

// PageLayout sets the head from its frontmatter once, on setup; it is keyed by ID below so it
// sets the title again when navigation moves from one record to another.
const frontmatter = computed(() => ({ title: record.value?.names.en ?? 'No record' }));

const otherNames = computed(() =>
  Object.entries(record.value?.names ?? {}).filter(([lang]) => lang !== 'en'),
);

const span = computed(() => {
  const { start, end } = record.value?.span ?? { start: null, end: null };
  if (start === null && end === null) return '';
  if (start === end) return formatYear(start ?? 0);
  return `${start === null ? '?' : formatYear(start)} – ${end === null ? '?' : formatYear(end)}`;
});

// /map at the record's first known year, focused on it.
const mapLink = computed(() => {
  const { start, end } = record.value?.span ?? { start: null, end: null };
  const year = start ?? end;
  return year === null ? null : `/map?focus=${id.value}&t=${formatYearParam(year)}`;
});

const facts = computed(() => {
  const r = record.value;
  if (r === undefined) return [];
  const rows: [string, string][] = [['Type', r.type]];
  if (span.value) rows.push(['Dates', span.value]);
  if (r.family !== undefined) rows.push(['Family', r.family]);
  if (r.language !== undefined) rows.push(['Language', r.language]);
  if (r.status !== undefined) rows.push(['Status', r.status]);
  if (r.kind !== undefined) rows.push(['Kind', r.kind]);
  if (r.coords !== undefined) {
    const [lon, lat] = r.coords;
    rows.push(['Coordinates', `${lat}, ${lon}`]);
  }
  return rows;
});

const claimGroups = computed(() => {
  const groups = new Map<string, RecordClaim[]>();
  for (const claim of record.value?.claims ?? []) {
    const list = groups.get(claim.label) ?? [];
    list.push(claim);
    groups.set(claim.label, list);
  }
  return [...groups];
});

const sourceList = computed(() =>
  Object.values(record.value?.sources ?? {}).toSorted((a, b) =>
    a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'primary' ? -1 : 1,
  ),
);

function confidenceLabel(claim: RecordClaim): string {
  return vocab.value?.confidence[claim.confidence].label ?? claim.confidence;
}
function confidenceMeaning(claim: RecordClaim): string | undefined {
  return vocab.value?.confidence[claim.confidence].meaning;
}
function basisLabel(claim: RecordClaim): string {
  return vocab.value?.basis[claim.basis].label ?? claim.basis;
}
function basisMeaning(claim: RecordClaim): string | undefined {
  return vocab.value?.basis[claim.basis].meaning;
}
function sourceTitle(key: string): string {
  return record.value?.sources[key]?.title ?? key;
}
function people(source: RecordSource): string {
  const parts: string[] = [];
  if (source.authors?.length) parts.push(source.authors.join(', '));
  if (source.translators?.length) parts.push(`trans. ${source.translators.join(', ')}`);
  return parts.join('; ');
}
</script>

<template>
  <PageLayout :key="id" :frontmatter="frontmatter">
    <template v-if="record">
      <h1>{{ record.names.en }}</h1>
      <p v-if="otherNames.length > 0" class="text-gray-600">
        <template v-for="([lang, name], index) in otherNames" :key="lang">
          <span v-if="index > 0">, </span><span :lang="lang">{{ name }}</span>
          <span class="text-sm text-gray-500"> ({{ lang }})</span>
        </template>
      </p>

      <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
        <template v-for="[term, value] in facts" :key="term">
          <dt class="font-medium text-gray-700">{{ term }}</dt>
          <dd class="m-0">{{ value }}</dd>
        </template>
      </dl>
      <p v-if="mapLink"><RouterLink :to="mapLink">Show on map</RouterLink></p>

      <template v-if="claimGroups.length > 0">
        <h2 id="claims">Claims</h2>
        <section v-for="[label, claims] in claimGroups" :key="label">
          <h3>{{ label }}</h3>
          <ul class="list-none pl-0">
            <li
              v-for="claim in claims"
              :key="`${claim.id}:${claim.derived}`"
              class="rounded-lg border p-4"
              :class="[
                claim.confidence === 'C' ? 'border-dashed border-gray-400' : 'border-gray-200',
                { italic: claim.basis === 'tradition' },
              ]"
            >
              <p class="mt-0">
                <RouterLink v-if="claim.other" :to="`/e/${claim.other.id}`">{{
                  claim.other.name
                }}</RouterLink>
                <template v-if="claim.whenText">
                  <span v-if="claim.other">, </span>{{ claim.whenText }}
                </template>
                <template v-if="claim.where">
                  in <RouterLink :to="`/e/${claim.where.id}`">{{ claim.where.name }}</RouterLink>
                </template>
              </p>
              <p class="text-sm text-gray-600 not-italic">
                <span :title="confidenceMeaning(claim)"
                  >{{ claim.confidence }} · {{ confidenceLabel(claim) }}</span
                >
                ·
                <span :title="basisMeaning(claim)">{{ basisLabel(claim) }}</span>
                <span v-if="claim.confidence === 'C'" class="font-medium text-gray-700">
                  · contested</span
                >
                <span v-if="claim.basis === 'tradition'" class="font-medium text-gray-700">
                  · a tradition's own account</span
                >
                · origin {{ claim.origin }} · reviewed {{ claim.reviewed }}
              </p>
              <ul class="text-sm not-italic">
                <li v-for="(source, index) in claim.sources" :key="index">
                  {{ sourceTitle(source.key) }}, {{ source.locator }}
                  <span class="text-gray-500">({{ source.stance }})</span>
                  <blockquote class="my-1">{{ source.excerpt }}</blockquote>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </template>

      <template v-if="sourceList.length > 0">
        <h2 id="sources">Sources</h2>
        <ul>
          <li v-for="source in sourceList" :key="source.key">
            <a v-if="source.url" :href="source.url" rel="noopener noreferrer">{{ source.title }}</a>
            <cite v-else>{{ source.title }}</cite>
            <span v-if="people(source)">, {{ people(source) }}</span>
            <span v-if="source.writtenText">, written {{ source.writtenText }}</span>
            <span class="text-sm text-gray-500"> ({{ source.kind }})</span>
          </li>
        </ul>
      </template>
    </template>
    <template v-else>
      <h1>No record</h1>
      <p>There is no record for “{{ id }}”.</p>
      <p><RouterLink to="/">Back to home</RouterLink></p>
    </template>
  </PageLayout>
</template>

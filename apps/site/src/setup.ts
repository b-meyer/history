import type { QDocsSetup } from 'qdocs/config';
import { setSearchFilter } from 'qdocs/search';
import AiOffNotice from './components/AiOffNotice.vue';
import { useReaderSettings } from './composables/useReaderSettings.ts';
import { loadReading, loadRecordPage } from './records.ts';
import './reader.css';

export const RECORD_ROUTE = '/e/:id';
export const READING_ROUTE = '/reading';

// Loads a record page's data, or the reading list, before its route resolves. createApp waits for the router before it
// renders on the server and before it mounts in the browser, so both see the same data.
/** A search entry's slug is its page path without a leading slash: wiki, wiki/islam/Shia. */
export function isWikiSlug(slug: string): boolean {
  return slug === 'wiki' || slug.startsWith('wiki/');
}

const setup: QDocsSetup = ({ app, router }) => {
  // Wiki pages open with this notice, which the AI-prose setting shows in place of the article.
  app.component('AiOffNotice', AiOffNotice);
  // Wiki results drop out of search while AI prose is off.
  const { aiProse } = useReaderSettings();
  setSearchFilter((entry) => aiProse.value || !isWikiSlug(entry.slug));

  router.beforeResolve(async (to) => {
    if (to.path === READING_ROUTE) {
      await loadReading(import.meta.env.SSR);
      return;
    }
    if (!to.matched.some((route) => route.path === RECORD_ROUTE)) return;
    const id = to.params['id'];
    if (typeof id !== 'string') return;
    await loadRecordPage(id, import.meta.env.SSR);
  });
};

export default setup;

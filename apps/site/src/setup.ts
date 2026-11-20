import type { QDocsSetup } from 'qdocs/config';
import { loadReading, loadRecordPage } from './records.ts';

export const RECORD_ROUTE = '/e/:id';
export const READING_ROUTE = '/reading';

// Loads a record page's data, or the reading list, before its route resolves. createApp waits for the router before it
// renders on the server and before it mounts in the browser, so both see the same data.
const setup: QDocsSetup = ({ router }) => {
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

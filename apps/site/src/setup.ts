import type { QDocsSetup } from 'qdocs/config';
import { loadRecordPage } from './records.ts';

export const RECORD_ROUTE = '/e/:id';

// Loads a record page's data before its route resolves. createApp waits for the router before it
// renders on the server and before it mounts in the browser, so both see the same data.
const setup: QDocsSetup = ({ router }) => {
  router.beforeResolve(async (to) => {
    if (!to.matched.some((route) => route.path === RECORD_ROUTE)) return;
    const id = to.params['id'];
    if (typeof id !== 'string') return;
    await loadRecordPage(id, import.meta.env.SSR);
  });
};

export default setup;

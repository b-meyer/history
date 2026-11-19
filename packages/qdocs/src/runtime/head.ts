import { createUnhead, headSymbol, type VueHeadClient } from '@unhead/vue';
import { createHead as createClientHead } from '@unhead/vue/client';
import type { App } from 'vue';

/**
 * Creates the app's head and provides it. The server head is rendered into each page by
 * qdocs-ssg; the client head renders to the DOM, so the title and meta follow client-side
 * navigation.
 */
export function provideHead(app: App): VueHeadClient {
  const head = import.meta.env.SSR ? createUnhead() : createClientHead();
  app.provide(headSymbol, head);
  return head;
}

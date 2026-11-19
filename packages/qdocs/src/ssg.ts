import './styles/entry.css';
import config from 'virtual:@qdocs/config';
import setup from 'virtual:@qdocs/setup';
import { createSSRApp, nextTick } from 'vue';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import App from './App.vue';
import { CodeGroup, HomeLayout, LayoutResolver, NotFoundPage, PageLayout } from './components';
import { CONFIG_KEY } from './config';
import { scrollBehavior } from './routerFactory';
import { provideHead } from './runtime/head';

/**
 * Creates the Vue app instance. Called once by the browser entry (no routePath — mounts to #app
 * after the router is ready) and once per route by the SSG build script (with routePath — navigates
 * then returns for renderToString).
 */
export async function createApp(routePath?: string) {
  // createSSRApp on both sides: server rendering works either way, but the client
  // side requires it to trigger hydration against the pre-rendered HTML.
  const app = createSSRApp(App);
  const head = provideHead(app);
  const router = createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes: [...routes, { path: '/:pathMatch(.*)*', component: NotFoundPage }],
    scrollBehavior,
  });

  // The consumer's setup runs before app.use(router), which starts the first client navigation,
  // so guards it registers (data loading, say) finish before SSR renders and before hydration.
  if (setup) await setup({ app, router });

  app.use(router);
  app.component('CodeGroup', CodeGroup);
  app.component('LayoutResolver', LayoutResolver);
  app.component('PageLayout', PageLayout);
  app.component('HomeLayout', HomeLayout);
  app.provide(CONFIG_KEY, config);
  head.push({ titleTemplate: (title) => (title ? `${title} — ${config.title}` : config.title) });

  if (!import.meta.env.SSR) {
    // Move focus to #main-content on every client-side route change so keyboard
    // and screen-reader users don't need to re-navigate past the header on each page.
    router.afterEach(async () => {
      await nextTick();
      document.querySelector<HTMLElement>('#main-content')?.focus();
    });
    await router.isReady();
    app.mount('#app');
  } else if (routePath !== undefined) {
    await router.push(routePath);
    await router.isReady();
  }

  return { app, router, head };
}

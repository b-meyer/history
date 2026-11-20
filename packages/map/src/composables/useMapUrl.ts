import { onBeforeUnmount, reactive, watch } from 'vue';
import { formatMapUrl, parseMapUrl, type MapUrlState } from '../url.ts';

const WRITE_DELAY_MS = 250;

/**
 * Map state backed by the URL. It reads the query once, then writes changes back with
 * history.replaceState, keeping vue-router's history.state. Going through the router would run a
 * navigation, guards and all, on every pan and every tick of the time slider.
 */
export function useMapUrl(): MapUrlState {
  const state = reactive(parseMapUrl(window.location.search));
  let timer: ReturnType<typeof setTimeout> | undefined;

  function write(): void {
    timer = undefined;
    const { pathname, hash } = window.location;
    const url = `${pathname}${formatMapUrl(state)}${hash}`;
    if (url !== `${pathname}${window.location.search}${hash}`) {
      window.history.replaceState(window.history.state, '', url);
    }
  }

  watch(
    state,
    () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(write, WRITE_DELAY_MS);
    },
    { deep: true },
  );

  onBeforeUnmount(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  return state;
}

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createApp, defineComponent, h, nextTick } from 'vue';
import type { MapUrlState } from '../url.ts';
import { useMapUrl } from './useMapUrl.ts';

function mount(): { state: MapUrlState; unmount: () => void } {
  let state: MapUrlState | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        state = useMapUrl();
        return () => h('div');
      },
    }),
  );
  app.mount(document.createElement('div'));
  if (state === undefined) throw new Error('not mounted');
  return { state, unmount: () => app.unmount() };
}

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState({ back: null, current: '/map' }, '', '/map?t=265ce&focus=porphyry');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMapUrl', () => {
  it('reads the URL once', () => {
    const { state, unmount } = mount();
    expect(state.t).toBe(265);
    expect(state.focus).toBe('porphyry');
    unmount();
  });

  it('writes changes with replaceState, keeping history.state', async () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    const { state, unmount } = mount();
    state.t = -499;
    state.t = -498;
    await nextTick();
    expect(replace).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe('?t=499bce&focus=porphyry');
    expect(window.history.state).toEqual({ back: null, current: '/map' });
    unmount();
  });

  it('drops a pending write on unmount', async () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    const { state, unmount } = mount();
    state.focus = null;
    await nextTick();
    unmount();
    vi.runAllTimers();
    expect(replace).not.toHaveBeenCalled();
  });
});

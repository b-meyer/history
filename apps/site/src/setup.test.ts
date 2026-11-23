import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { App } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { loadRecordPage } from './records.ts';
import setup from './setup.ts';

vi.mock('./records.ts', () => ({ loadRecordPage: vi.fn(() => Promise.resolve()) }));

const fakeApp = (): App => ({ component: vi.fn() }) as unknown as App;

function makeRouter() {
  const component = { render: () => null };
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component },
      { path: '/e/:id', component },
    ],
  });
}

describe('setup', () => {
  beforeEach(() => {
    vi.mocked(loadRecordPage).mockClear();
  });

  it('loads a record page before its route resolves', async () => {
    const router = makeRouter();
    await setup({ app: fakeApp(), router });
    await router.push('/e/plotinus');
    expect(loadRecordPage).toHaveBeenCalledWith('plotinus', import.meta.env.SSR);
  });

  it('leaves other routes alone', async () => {
    const router = makeRouter();
    await setup({ app: fakeApp(), router });
    await router.push('/');
    expect(loadRecordPage).not.toHaveBeenCalled();
  });

  it('fails the navigation when loading throws', async () => {
    vi.mocked(loadRecordPage).mockRejectedValueOnce(new Error('record "x" is listed'));
    const router = makeRouter();
    await setup({ app: fakeApp(), router });
    await expect(router.push('/e/x')).rejects.toThrow('record "x"');
  });
});

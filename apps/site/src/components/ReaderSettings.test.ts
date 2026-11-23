// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createApp, nextTick } from 'vue';
import { AI_STORAGE_KEY } from '../../readerSettings.ts';
import { useReaderSettings } from '../composables/useReaderSettings.ts';
import ReaderSettings from './ReaderSettings.vue';

let host: HTMLElement | undefined;

function mountSettings(): HTMLElement {
  host = document.createElement('div');
  document.body.append(host);
  createApp(ReaderSettings).mount(host);
  return host;
}

const button = (root: HTMLElement, label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!found) throw new Error(`no ${label} button`);
  return found;
};

afterEach(() => {
  host?.remove();
  useReaderSettings().setAiProse(true);
  localStorage.clear();
});

describe('ReaderSettings', () => {
  it('shows On pressed and no badge by default', () => {
    const root = mountSettings();
    expect(button(root, 'On').getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-testid="ai-badge"]')).toBeNull();
  });

  it('turns AI prose off, shows the badge and stores the choice', async () => {
    const root = mountSettings();
    button(root, 'Off').click();
    await nextTick();
    expect(button(root, 'Off').getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-testid="ai-badge"]')?.textContent).toBe('Off');
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe('off');
  });

  it('applies a stored off setting on mount', async () => {
    localStorage.setItem(AI_STORAGE_KEY, 'off');
    const root = mountSettings();
    await nextTick();
    expect(root.querySelector('[data-testid="ai-badge"]')).not.toBeNull();
  });

  it('turns back on and clears the badge', async () => {
    const root = mountSettings();
    button(root, 'Off').click();
    await nextTick();
    button(root, 'On').click();
    await nextTick();
    expect(root.querySelector('[data-testid="ai-badge"]')).toBeNull();
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe('on');
  });
});

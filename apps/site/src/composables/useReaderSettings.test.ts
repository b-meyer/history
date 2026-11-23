// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { AI_STORAGE_KEY } from '../../readerSettings.ts';
import { useReaderSettings } from './useReaderSettings.ts';

afterEach(() => {
  vi.restoreAllMocks();
  useReaderSettings().setAiProse(true);
  localStorage.clear();
  delete document.documentElement.dataset.ai;
});

describe('useReaderSettings', () => {
  it('starts with AI prose on', () => {
    expect(useReaderSettings().aiProse.value).toBe(true);
  });

  it('reads an off setting from storage on sync', () => {
    localStorage.setItem(AI_STORAGE_KEY, 'off');
    const { aiProse, syncFromStorage } = useReaderSettings();
    syncFromStorage();
    expect(aiProse.value).toBe(false);
  });

  it('keeps it on when storage holds nothing or something else', () => {
    localStorage.setItem(AI_STORAGE_KEY, 'maybe');
    const { aiProse, syncFromStorage } = useReaderSettings();
    syncFromStorage();
    expect(aiProse.value).toBe(true);
  });

  it('stores the choice and sets data-ai on the document', () => {
    const { aiProse, setAiProse } = useReaderSettings();
    setAiProse(false);
    expect(aiProse.value).toBe(false);
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe('off');
    expect(document.documentElement.dataset.ai).toBe('off');
    setAiProse(true);
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe('on');
    expect(document.documentElement.dataset.ai).toBe('on');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { aiProse, setAiProse, syncFromStorage } = useReaderSettings();
    expect(() => syncFromStorage()).not.toThrow();
    expect(aiProse.value).toBe(true);
    expect(() => setAiProse(false)).not.toThrow();
    expect(aiProse.value).toBe(false);
    expect(document.documentElement.dataset.ai).toBe('off');
  });
});

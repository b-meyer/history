import { ref } from 'vue';
import { AI_STORAGE_KEY } from '../../readerSettings.ts';

// Reader settings live in the app, not in qdocs: the AI-prose setting is this site's, and qdocs only
// offers the generic hooks (headerEnd, prePaintScript, setSearchFilter) it plugs into.
//
// SSR-safe in the same way as qdocs's useReadingMode: the server and the first client render both
// use the default, and the stored value is applied by syncFromStorage() from a component's
// onMounted, so hydration never sees a mismatch. The pre-paint script has already set
// <html data-ai> from the same key, so CSS shows the right state before Vue runs.
const aiProse = ref(true);

function setAttribute(value: boolean): void {
  document.documentElement.dataset.ai = value ? 'on' : 'off';
}

function syncFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    aiProse.value = localStorage.getItem(AI_STORAGE_KEY) !== 'off';
  } catch {
    // Storage blocked: keep the default.
  }
}

function setAiProse(value: boolean): void {
  aiProse.value = value;
  if (typeof window === 'undefined') return;
  setAttribute(value);
  try {
    localStorage.setItem(AI_STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // Storage blocked: the setting lasts until the page closes.
  }
}

export function useReaderSettings() {
  return { aiProse, setAiProse, syncFromStorage };
}

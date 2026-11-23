// The reader's AI-prose setting, shared by the pre-paint script (loaded from vite.config.ts, so
// Node ESM rules apply: relative imports with .ts extensions) and the app's composable.

export const AI_STORAGE_KEY = 'ai-prose';

/**
 * Runs in the head before first paint: sets data-ai="on" or "off" on <html> from the stored
 * setting, so CSS under html[data-ai="off"] hides AI prose with no flash. A missing or unreadable
 * setting means on.
 */
export const AI_PREPAINT_SCRIPT = `(function(){var v='on';try{if(localStorage.getItem('${AI_STORAGE_KEY}')==='off')v='off';}catch(e){}document.documentElement.setAttribute('data-ai',v);})();`;

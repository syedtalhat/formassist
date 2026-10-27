/**
 * Firebase Web Configuration
 * Conditional initialization for mock, emulator, and live modes.
 */

export type ApiMode = 'mock' | 'emulator' | 'live';

export const defaultApiMode: ApiMode = (import.meta.env.VITE_API_MODE || 'live').toLowerCase() as ApiMode;

export async function getApiMode(): Promise<ApiMode> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const res = await chrome.storage.local.get(['api_mode']);
      if (res.api_mode === 'mock' || res.api_mode === 'emulator' || res.api_mode === 'live') {
        return res.api_mode;
      }
    } catch {
      // ignore
    }
  }
  return defaultApiMode;
}

export async function setApiMode(mode: ApiMode): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ api_mode: mode });
  }
}

export const apiMode = defaultApiMode;
export const isMockMode = defaultApiMode === 'mock';
export const isEmulatorMode = defaultApiMode === 'emulator';
export const isLiveMode = defaultApiMode === 'live';

export const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY;

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (isEmulatorMode
    ? 'http://127.0.0.1:5001/formassist-83d6a/asia-south1/api'
    : 'http://localhost:5001/api');

export const authEmulatorHost =
  import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

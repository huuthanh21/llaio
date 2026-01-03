import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

/** Static Google Custom Search Engine ID */
export const GOOGLE_CSE_SEARCH_ENGINE_ID = 'f302260bc5fc347ba';

interface SettingsState {
  apiKey: string;
  googleCseApiKey: string;
  isModalOpen: boolean;
}

const initialState: SettingsState = {
  apiKey: '',
  googleCseApiKey: '',
  isModalOpen: false,
};

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'llaio_settings_api_key',
  GOOGLE_CSE_API_KEY: 'llaio_google_cse_api_key',
} as const;

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setApiKey(apiKey: string): void {
      patchState(store, { apiKey });
    },
    setGoogleCseApiKey(googleCseApiKey: string): void {
      patchState(store, { googleCseApiKey });
    },
    openModal(): void {
      patchState(store, { isModalOpen: true });
    },
    closeModal(): void {
      patchState(store, { isModalOpen: false });
    },
  })),
  withHooks({
    onInit(store) {
      // Load from local storage
      const savedKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      const savedCseKey = localStorage.getItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY);

      patchState(store, {
        ...(savedKey && { apiKey: savedKey }),
        ...(savedCseKey && { googleCseApiKey: savedCseKey }),
      });

      // Persist Gemini API key
      effect(() => {
        const apiKey = store.apiKey();
        if (apiKey) {
          localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
        } else {
          localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
        }
      });

      // Persist Google CSE API key
      effect(() => {
        const key = store.googleCseApiKey();
        if (key) {
          localStorage.setItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY, key);
        } else {
          localStorage.removeItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY);
        }
      });
    },
  }),
);

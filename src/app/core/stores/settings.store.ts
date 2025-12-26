import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

interface SettingsState {
  apiKey: string;
  isModalOpen: boolean;
}

const initialState: SettingsState = {
  apiKey: '',
  isModalOpen: false,
};

const SETTINGS_STORAGE_KEY = 'llaio_settings_api_key';

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setApiKey(apiKey: string): void {
      patchState(store, { apiKey });
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
      const savedKey = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedKey) {
        patchState(store, { apiKey: savedKey });
      }

      // Save to local storage whenever it changes
      effect(() => {
        const apiKey = store.apiKey();
        if (apiKey) {
          localStorage.setItem(SETTINGS_STORAGE_KEY, apiKey);
        } else {
          localStorage.removeItem(SETTINGS_STORAGE_KEY);
        }
      });
    },
  }),
);

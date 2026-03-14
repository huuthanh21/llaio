import { create } from 'zustand';

/** Static Google Custom Search Engine ID — NOT stored in state */
export const GOOGLE_CSE_ID = 'f302260bc5fc347ba';

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'llaio_settings_api_key',
  GOOGLE_CSE_API_KEY: 'llaio_google_cse_api_key',
} as const;

interface SettingsState {
  apiKey: string;
  googleCseApiKey: string;
  isModalOpen: boolean;
  setApiKey: (apiKey: string) => void;
  setGoogleCseApiKey: (googleCseApiKey: string) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useSettingsStore = create<SettingsState>(() => {
  // Read from localStorage synchronously on initialization
  const savedApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) ?? '';
  const savedCseApiKey = localStorage.getItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY) ?? '';

  return {
    apiKey: savedApiKey,
    googleCseApiKey: savedCseApiKey,
    isModalOpen: false,

    setApiKey: (apiKey: string) => {
      if (apiKey) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      }
      useSettingsStore.setState({ apiKey });
    },

    setGoogleCseApiKey: (googleCseApiKey: string) => {
      if (googleCseApiKey) {
        localStorage.setItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY, googleCseApiKey);
      } else {
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_CSE_API_KEY);
      }
      useSettingsStore.setState({ googleCseApiKey });
    },

    openModal: () => {
      useSettingsStore.setState({ isModalOpen: true });
    },

    closeModal: () => {
      useSettingsStore.setState({ isModalOpen: false });
    },
  };
});

import { create } from 'zustand';

export type Language =
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Japanese'
  | 'Italian'
  | 'Chinese'
  | 'Vietnamese';

export const LANGUAGES: Language[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Italian',
  'Chinese',
  'Vietnamese',
];

const STORAGE_KEYS = {
  TARGET_LANGUAGE: 'target_language',
  NATIVE_LANGUAGE: 'native_language',
} as const;

function getSavedLanguage(key: string, defaultLang: Language): Language {
  try {
    const saved = localStorage.getItem(key);
    if (saved && LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }
  } catch {
    // ignore
  }
  return defaultLang;
}

interface LanguageState {
  targetLanguage: Language;
  nativeLanguage: Language;
  setLanguage: (language: Language) => void;
  setNativeLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>(() => ({
  targetLanguage: getSavedLanguage(STORAGE_KEYS.TARGET_LANGUAGE, 'English'),
  nativeLanguage: getSavedLanguage(STORAGE_KEYS.NATIVE_LANGUAGE, 'Vietnamese'),

  setLanguage: (language: Language) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, language);
    } catch {
      // ignore
    }
    useLanguageStore.setState({ targetLanguage: language });
  },

  setNativeLanguage: (language: Language) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NATIVE_LANGUAGE, language);
    } catch {
      // ignore
    }
    useLanguageStore.setState({ nativeLanguage: language });
  },
}));

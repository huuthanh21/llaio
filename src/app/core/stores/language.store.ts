import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

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

interface LanguageState {
  targetLanguage: Language;
  nativeLanguage: Language;
}

const STORAGE_KEYS = {
  TARGET_LANGUAGE: 'target_language',
  NATIVE_LANGUAGE: 'native_language',
};

function getSavedLanguage(key: string, defaultLang: Language): Language {
  try {
    const saved = localStorage.getItem(key);
    // Simple validation to ensure it's a valid Language
    if (saved && LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }
  } catch {
    // ignore
  }
  return defaultLang;
}

const initialState: LanguageState = {
  targetLanguage: getSavedLanguage(STORAGE_KEYS.TARGET_LANGUAGE, 'English'),
  nativeLanguage: getSavedLanguage(STORAGE_KEYS.NATIVE_LANGUAGE, 'Vietnamese'),
};

export const LanguageStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLanguage(language: Language): void {
      patchState(store, { targetLanguage: language });
      try {
        localStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, language);
      } catch {
        // ignore
      }
    },
    setNativeLanguage(language: Language): void {
      patchState(store, { nativeLanguage: language });
      try {
        localStorage.setItem(STORAGE_KEYS.NATIVE_LANGUAGE, language);
      } catch {
        // ignore
      }
    },
  })),
);

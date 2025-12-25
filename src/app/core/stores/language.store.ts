import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type Language = 'Spanish' | 'French' | 'German' | 'Japanese' | 'Italian' | 'Chinese';

interface LanguageState {
  targetLanguage: Language;
}

const initialState: LanguageState = {
  targetLanguage: 'Spanish', // Default
};

export const LanguageStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLanguage(language: Language): void {
      patchState(store, { targetLanguage: language });
    },
  })),
);

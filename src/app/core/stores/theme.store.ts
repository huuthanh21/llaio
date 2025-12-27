import { isPlatformBrowser } from '@angular/common';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

export type Theme = 'System' | 'Light' | 'Dark';

export const THEMES: Theme[] = ['System', 'Light', 'Dark'];

interface ThemeState {
  theme: Theme;
}

const initialState: ThemeState = {
  theme: 'System',
};

const THEME_STORAGE_KEY = 'llaio_theme';

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setTheme(theme: Theme): void {
      patchState(store, { theme });
    },
  })),
  withHooks({
    onInit(store) {
      const platformId = inject(PLATFORM_ID);
      const isBrowser = isPlatformBrowser(platformId);

      if (isBrowser) {
        // Load from local storage
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
        if (savedTheme && THEMES.includes(savedTheme)) {
          patchState(store, { theme: savedTheme });
        }

        // Effect to apply theme
        effect(() => {
          const theme = store.theme();
          localStorage.setItem(THEME_STORAGE_KEY, theme);

          const applyTheme = (isDark: boolean) => {
            if (isDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          };

          if (theme === 'Dark') {
            applyTheme(true);
          } else if (theme === 'Light') {
            applyTheme(false);
          } else {
            // System
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            // Listen for changes
            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handler);

            // Cleanup listener when effect re-runs or component destroys (though this is a root store)
            return () => mediaQuery.removeEventListener('change', handler);
          }
          return undefined;
        });
      }
    },
  }),
);

import { create } from 'zustand';

export type Theme = 'System' | 'Light' | 'Dark';

export const THEMES: Theme[] = ['System', 'Light', 'Dark'];

const THEME_STORAGE_KEY = 'llaio_theme';

let systemThemeCleanup: (() => void) | undefined;

function applyThemeClass(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function applyTheme(theme: Theme): void {
  if (systemThemeCleanup) {
    systemThemeCleanup();
    systemThemeCleanup = undefined;
  }

  if (theme === 'Dark') {
    applyThemeClass(true);
  } else if (theme === 'Light') {
    applyThemeClass(false);
  } else {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyThemeClass(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => applyThemeClass(e.matches);
    mediaQuery.addEventListener('change', handler);
    systemThemeCleanup = () => mediaQuery.removeEventListener('change', handler);
  }
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  if (saved && THEMES.includes(saved)) {
    return saved;
  }
  return 'System';
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: initialTheme,

  setTheme: (theme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    useThemeStore.setState({ theme });
  },
}));

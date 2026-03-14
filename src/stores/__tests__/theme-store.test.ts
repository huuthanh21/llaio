import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useThemeStore } from '../theme-store';

describe('useThemeStore', () => {
  beforeEach(() => {
    window.matchMedia = (_query: string) => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      media: '',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    });
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ theme: 'System' });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  describe('default theme', () => {
    it('has theme "System" by default', () => {
      expect(useThemeStore.getState().theme).toBe('System');
    });
  });

  describe('setTheme("Dark")', () => {
    it('updates theme state to "Dark"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Dark');
      expect(useThemeStore.getState().theme).toBe('Dark');
    });

    it('adds .dark class to document.documentElement', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('persists "Dark" to localStorage under "llaio_theme"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Dark');
      expect(localStorage.getItem('llaio_theme')).toBe('Dark');
    });
  });

  describe('setTheme("Light")', () => {
    it('updates theme state to "Light"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Light');
      expect(useThemeStore.getState().theme).toBe('Light');
    });

    it('removes .dark class from document.documentElement', () => {
      document.documentElement.classList.add('dark');
      const { setTheme } = useThemeStore.getState();
      setTheme('Light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists "Light" to localStorage under "llaio_theme"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Light');
      expect(localStorage.getItem('llaio_theme')).toBe('Light');
    });
  });

  describe('setTheme("System")', () => {
    it('updates theme state to "System"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('Dark');
      setTheme('System');
      expect(useThemeStore.getState().theme).toBe('System');
    });

    it('persists "System" to localStorage under "llaio_theme"', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('System');
      expect(localStorage.getItem('llaio_theme')).toBe('System');
    });
  });
});

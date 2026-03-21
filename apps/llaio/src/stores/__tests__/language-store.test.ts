import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useLanguageStore } from '../language-store';
import type { Language } from '../language-store';

describe('useLanguageStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLanguageStore.setState({
      targetLanguage: 'English',
      nativeLanguage: 'Vietnamese',
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('default values', () => {
    it('has targetLanguage "English" by default', () => {
      expect(useLanguageStore.getState().targetLanguage).toBe<Language>('English');
    });

    it('has nativeLanguage "Vietnamese" by default', () => {
      expect(useLanguageStore.getState().nativeLanguage).toBe<Language>('Vietnamese');
    });
  });

  describe('setLanguage', () => {
    it('updates targetLanguage in state', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('French');
      expect(useLanguageStore.getState().targetLanguage).toBe('French');
    });

    it('persists targetLanguage to localStorage under "target_language"', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('Japanese');
      expect(localStorage.getItem('target_language')).toBe('Japanese');
    });
  });

  describe('setNativeLanguage', () => {
    it('updates nativeLanguage in state', () => {
      const { setNativeLanguage } = useLanguageStore.getState();
      setNativeLanguage('Spanish');
      expect(useLanguageStore.getState().nativeLanguage).toBe('Spanish');
    });

    it('persists nativeLanguage to localStorage under "native_language"', () => {
      const { setNativeLanguage } = useLanguageStore.getState();
      setNativeLanguage('German');
      expect(localStorage.getItem('native_language')).toBe('German');
    });
  });

  describe('persistence round-trip', () => {
    it('setLanguage then getItem returns the same value', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('Chinese');
      expect(localStorage.getItem('target_language')).toBe('Chinese');
      expect(useLanguageStore.getState().targetLanguage).toBe('Chinese');
    });

    it('setNativeLanguage then getItem returns the same value', () => {
      const { setNativeLanguage } = useLanguageStore.getState();
      setNativeLanguage('Italian');
      expect(localStorage.getItem('native_language')).toBe('Italian');
      expect(useLanguageStore.getState().nativeLanguage).toBe('Italian');
    });
  });
});

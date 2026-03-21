import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useSettingsStore } from '../settings-store';

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      apiKey: '',
      googleCseApiKey: '',
      isModalOpen: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('has empty apiKey when localStorage is empty', () => {
      expect(useSettingsStore.getState().apiKey).toBe('');
    });

    it('has empty googleCseApiKey when localStorage is empty', () => {
      expect(useSettingsStore.getState().googleCseApiKey).toBe('');
    });

    it('has isModalOpen false by default', () => {
      expect(useSettingsStore.getState().isModalOpen).toBe(false);
    });
  });

  describe('setApiKey', () => {
    it('updates apiKey in state', () => {
      const { setApiKey } = useSettingsStore.getState();
      setApiKey('my-gemini-key');
      expect(useSettingsStore.getState().apiKey).toBe('my-gemini-key');
    });

    it('persists apiKey to localStorage under "llaio_settings_api_key"', () => {
      const { setApiKey } = useSettingsStore.getState();
      setApiKey('my-gemini-key');
      expect(localStorage.getItem('llaio_settings_api_key')).toBe('my-gemini-key');
    });

    it('removes localStorage key when apiKey is set to empty string', () => {
      const { setApiKey } = useSettingsStore.getState();
      setApiKey('some-key');
      setApiKey('');
      expect(localStorage.getItem('llaio_settings_api_key')).toBeNull();
    });

    it('state reflects empty string after clearing apiKey', () => {
      const { setApiKey } = useSettingsStore.getState();
      setApiKey('some-key');
      setApiKey('');
      expect(useSettingsStore.getState().apiKey).toBe('');
    });
  });

  describe('setGoogleCseApiKey', () => {
    it('updates googleCseApiKey in state', () => {
      const { setGoogleCseApiKey } = useSettingsStore.getState();
      setGoogleCseApiKey('cse-key-123');
      expect(useSettingsStore.getState().googleCseApiKey).toBe('cse-key-123');
    });

    it('persists googleCseApiKey to localStorage under "llaio_google_cse_api_key"', () => {
      const { setGoogleCseApiKey } = useSettingsStore.getState();
      setGoogleCseApiKey('cse-key-123');
      expect(localStorage.getItem('llaio_google_cse_api_key')).toBe('cse-key-123');
    });

    it('removes localStorage key when googleCseApiKey is set to empty string', () => {
      const { setGoogleCseApiKey } = useSettingsStore.getState();
      setGoogleCseApiKey('some-cse');
      setGoogleCseApiKey('');
      expect(localStorage.getItem('llaio_google_cse_api_key')).toBeNull();
    });
  });

  describe('openModal / closeModal', () => {
    it('openModal sets isModalOpen to true', () => {
      const { openModal } = useSettingsStore.getState();
      openModal();
      expect(useSettingsStore.getState().isModalOpen).toBe(true);
    });

    it('closeModal sets isModalOpen to false after opening', () => {
      const { openModal, closeModal } = useSettingsStore.getState();
      openModal();
      closeModal();
      expect(useSettingsStore.getState().isModalOpen).toBe(false);
    });
  });

  describe('localStorage persistence round-trip', () => {
    it('setApiKey then getItem returns the same value', () => {
      const { setApiKey } = useSettingsStore.getState();
      setApiKey('round-trip-key');
      expect(localStorage.getItem('llaio_settings_api_key')).toBe('round-trip-key');
      expect(useSettingsStore.getState().apiKey).toBe('round-trip-key');
    });

    it('setGoogleCseApiKey then getItem returns the same value', () => {
      const { setGoogleCseApiKey } = useSettingsStore.getState();
      setGoogleCseApiKey('round-trip-cse');
      expect(localStorage.getItem('llaio_google_cse_api_key')).toBe('round-trip-cse');
      expect(useSettingsStore.getState().googleCseApiKey).toBe('round-trip-cse');
    });
  });
});

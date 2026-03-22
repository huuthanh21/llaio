import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsModal } from '../settings-modal';

const baseStoreMock = {
  isModalOpen: false,
  openModal: vi.fn(),
  closeModal: vi.fn(),
  apiKey: '',
  googleCseApiKey: '',
  setApiKey: vi.fn(),
  setGoogleCseApiKey: vi.fn(),
};

vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: () => baseStoreMock,
}));

vi.mock('@/stores/language-store', () => ({
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: vi.fn(),
    setNativeLanguage: vi.fn(),
  }),
  LANGUAGES: [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Italian',
    'Chinese',
    'Vietnamese',
  ],
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({ theme: 'System', setTheme: vi.fn() }),
  THEMES: ['System', 'Light', 'Dark'],
}));

describe('SettingsModal — closed', () => {
  it('does NOT render dialog content when isModalOpen is false', () => {
    render(<SettingsModal />);
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('does NOT render the API key input when closed', () => {
    render(<SettingsModal />);
    expect(screen.queryByLabelText('Gemini API Key')).toBeNull();
    expect(screen.queryByPlaceholderText('Enter your API key')).toBeNull();
  });
});

describe('SettingsModal — open', () => {
  beforeEach(() => {
    baseStoreMock.isModalOpen = true;
  });

  afterEach(() => {
    baseStoreMock.isModalOpen = false;
  });

  it('renders the Settings dialog title when open', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders the Gemini API Key label', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Gemini API Key')).toBeTruthy();
  });

  it('renders the API key input field', () => {
    render(<SettingsModal />);
    expect(screen.getByPlaceholderText('Enter your API key')).toBeTruthy();
  });

  it('renders the Google Custom Search API Key label', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Google Custom Search API Key')).toBeTruthy();
  });

  it('renders the Google CSE API key input', () => {
    render(<SettingsModal />);
    expect(screen.getByPlaceholderText('Enter your Google CSE API key')).toBeTruthy();
  });

  it('renders the Theme label', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Theme')).toBeTruthy();
  });

  it('renders the Native Language label', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Native Language')).toBeTruthy();
  });

  it('renders the Save button', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('renders the app version label', () => {
    render(<SettingsModal />);
    expect(screen.getByText((content) => content.startsWith('Version '))).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordDefinition } from '../word-definition';

vi.mock('@/services/gemini-service', () => ({
  generateDefinition: vi.fn(),
}));

vi.mock('@/services/word-history-service', () => ({
  getHistory: vi.fn(() => []),
  addEntry: vi.fn(),
  getCachedResponse: vi.fn(() => null),
}));

vi.mock('@/services/saved-words-service', () => ({
  isWordSaved: vi.fn(() => false),
  saveWord: vi.fn(() => ({ ok: true })),
  removeWord: vi.fn(() => ({ ok: true, removed: true })),
  subscribeSavedWordsChanges: vi.fn(() => () => undefined),
}));

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    apiKey: 'test-api-key',
    googleCseApiKey: '',
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    setApiKey: vi.fn(),
    setGoogleCseApiKey: vi.fn(),
  }),
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: vi.fn(),
    setNativeLanguage: vi.fn(),
  }),
  useThemeStore: () => ({ theme: 'System', setTheme: vi.fn() }),
  THEMES: ['System', 'Light', 'Dark'],
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
  GOOGLE_CSE_ID: 'test-cse-id',
}));

describe('WordDefinition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the word input field', () => {
    render(<WordDefinition />);
    expect(screen.getByPlaceholderText('e.g. Serendipity')).toBeTruthy();
  });

  it('renders the Define button', () => {
    render(<WordDefinition />);
    expect(screen.getByText('Define')).toBeTruthy();
  });

  it('renders the Save word button', () => {
    render(<WordDefinition />);
    expect(screen.getByRole('button', { name: /save word/i })).toBeTruthy();
  });

  it('renders the Reset button', () => {
    render(<WordDefinition />);
    expect(screen.getByLabelText('Reset')).toBeTruthy();
  });

  it('Define button is disabled when word input is empty', () => {
    render(<WordDefinition />);
    const defineBtn = screen.getByText('Define').closest('button');
    expect(defineBtn?.disabled).toBe(true);
  });

  it('does not render history select when history is empty', () => {
    render(<WordDefinition />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders the idle content status placeholder', () => {
    render(<WordDefinition />);
    expect(screen.getByText('Look up any word')).toBeTruthy();
  });

  it('does not render history select placeholder when history is empty', () => {
    render(<WordDefinition />);
    expect(screen.queryByText('Recent words')).toBeNull();
  });
});

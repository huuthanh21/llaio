import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WordDefinition } from '../word-definition';
import { playPronunciation } from '@/services/pronunciation-service';
import { generateDefinition } from '@/services/gemini-service';

let mockedTargetLanguage = 'English';
let mockedNativeLanguage = 'Vietnamese';

vi.mock('@/services/gemini-service', () => ({
  generateDefinition: vi.fn(),
}));

vi.mock('@/services/pronunciation-service', () => ({
  playPronunciation: vi.fn(),
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
    targetLanguage: mockedTargetLanguage,
    nativeLanguage: mockedNativeLanguage,
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
    mockedTargetLanguage = 'English';
    mockedNativeLanguage = 'Vietnamese';
    vi.stubGlobal(
      'Audio',
      class {
        public currentTime = 0;
        public onended: (() => void) | null = null;
        public onerror: (() => void) | null = null;

        pause() {
          return undefined;
        }

        play() {
          return Promise.resolve();
        }
      },
    );
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('renders pronunciation button after a successful definition', async () => {
    const mockedGenerateDefinition = vi.mocked(generateDefinition);
    mockedGenerateDefinition.mockImplementation(async (_word, _key, _target, _native, onChunk) => {
      onChunk('A lucky discovery by chance.');
    });

    render(<WordDefinition />);

    const input = screen.getByPlaceholderText('e.g. Serendipity');
    fireEvent.change(input, { target: { value: 'serendipity' } });
    fireEvent.click(screen.getByText('Define'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play pronunciation for serendipity/i })).toBeTruthy();
    });
  });

  it('plays pronunciation for successful lookup', async () => {
    const mockedGenerateDefinition = vi.mocked(generateDefinition);
    mockedGenerateDefinition.mockImplementation(async (_word, _key, _target, _native, onChunk) => {
      onChunk('A lucky discovery by chance.');
    });

    const mockedPlayPronunciation = vi.mocked(playPronunciation);
    mockedPlayPronunciation.mockResolvedValue({
      ok: true,
      audioUrl: 'blob:playback-url',
    });

    render(<WordDefinition />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Serendipity'), {
      target: { value: 'serendipity' },
    });
    fireEvent.click(screen.getByText('Define'));

    const pronounceButton = await screen.findByRole('button', {
      name: /play pronunciation for serendipity/i,
    });
    fireEvent.click(pronounceButton);

    await waitFor(() => {
      expect(mockedPlayPronunciation).toHaveBeenCalledWith('serendipity', 'English');
    });
  });

  it('shows pronunciation error when service fails', async () => {
    const mockedGenerateDefinition = vi.mocked(generateDefinition);
    mockedGenerateDefinition.mockImplementation(async (_word, _key, _target, _native, onChunk) => {
      onChunk('A lucky discovery by chance.');
    });

    const mockedPlayPronunciation = vi.mocked(playPronunciation);
    mockedPlayPronunciation.mockResolvedValue({
      ok: false,
      error: 'Pronunciation quota exceeded',
    });

    render(<WordDefinition />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Serendipity'), {
      target: { value: 'serendipity' },
    });
    fireEvent.click(screen.getByText('Define'));

    const pronounceButton = await screen.findByRole('button', {
      name: /play pronunciation for serendipity/i,
    });
    fireEvent.click(pronounceButton);

    await waitFor(() => {
      expect(screen.getByText('Pronunciation quota exceeded')).toBeTruthy();
    });
  });

  it('resets lookup state when target language changes', async () => {
    const mockedGenerateDefinition = vi.mocked(generateDefinition);
    mockedGenerateDefinition.mockImplementation(async (_word, _key, _target, _native, onChunk) => {
      onChunk('A lucky discovery by chance.');
    });

    const { rerender } = render(<WordDefinition />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Serendipity'), {
      target: { value: 'serendipity' },
    });
    fireEvent.click(screen.getByText('Define'));

    await screen.findByRole('button', {
      name: /play pronunciation for serendipity/i,
    });

    expect(screen.queryByText('Look up any word')).toBeNull();

    mockedTargetLanguage = 'Spanish';
    rerender(<WordDefinition />);

    await waitFor(() => {
      expect(screen.getByText('Look up any word')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: /play pronunciation for serendipity/i })).toBeNull();
    expect((screen.getByPlaceholderText('e.g. Serendipity') as HTMLInputElement).value).toBe('');
  });
});

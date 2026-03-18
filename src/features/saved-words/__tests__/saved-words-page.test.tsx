import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SavedWordsPage } from '../saved-words-page';

const navigateMock = vi.fn();
const setIntentMock = vi.fn();
const listSavedWordsByLanguageMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/stores', () => ({
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: vi.fn(),
    setNativeLanguage: vi.fn(),
  }),
}));

vi.mock('@/services/flashcard-generator-intent-service', () => ({
  setSavedWordsGenerationIntent: (...args: unknown[]) => setIntentMock(...args),
}));

vi.mock('@/services/saved-words-service', () => ({
  listSavedWordsByLanguage: (...args: unknown[]) => listSavedWordsByLanguageMock(...args),
  subscribeSavedWordsChanges: () => () => undefined,
}));

describe('SavedWordsPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setIntentMock.mockReset();
    listSavedWordsByLanguageMock.mockReset();
    listSavedWordsByLanguageMock.mockReturnValue([
      {
        id: 'saved-1',
        word: 'apple',
        normalizedWord: 'apple',
        language: 'English',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'saved-2',
        word: 'banana',
        normalizedWord: 'banana',
        language: 'English',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('renders saved words for the selected language', () => {
    render(<SavedWordsPage />);

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('banana')).toBeInTheDocument();
  });

  it('shows empty-state when no words are saved', () => {
    listSavedWordsByLanguageMock.mockReturnValueOnce([]);
    render(<SavedWordsPage />);

    expect(screen.getByText(/no saved words yet/i)).toBeInTheDocument();
  });

  it('disables create action when no words are selected', () => {
    render(<SavedWordsPage />);

    expect(screen.getByRole('button', { name: /create flashcards \(0\)/i })).toBeDisabled();
    expect(setIntentMock).not.toHaveBeenCalled();
  });

  it('creates generation intent and navigates when selected words exist', () => {
    render(<SavedWordsPage />);

    fireEvent.click(screen.getByLabelText(/select apple/i));
    fireEvent.click(screen.getByRole('button', { name: /create flashcards \(1\)/i }));

    expect(setIntentMock).toHaveBeenCalledWith({
      source: 'saved-words',
      words: ['apple'],
      savedWordIds: ['saved-1'],
      language: 'English',
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: '/flashcard-generator' });
  });

  it('toggles select all and clear selection', () => {
    render(<SavedWordsPage />);

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));
    expect(screen.getByRole('button', { name: /create flashcards \(2\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(screen.getByRole('button', { name: /create flashcards \(0\)/i })).toBeInTheDocument();
  });

  it('disables create action again after clearing selection', () => {
    render(<SavedWordsPage />);

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(screen.getByRole('button', { name: /create flashcards \(0\)/i })).toBeDisabled();
  });
});

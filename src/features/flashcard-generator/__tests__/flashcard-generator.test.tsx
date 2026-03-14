import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import type { Flashcard } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { FlashcardGenerator } from '../flashcard-generator';

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    apiKey: 'test-key',
    googleCseApiKey: 'test-gkey',
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
  GOOGLE_CSE_ID: 'test-cse-id',
}));

vi.mock('@/services/gemini-service', () => ({
  generateFlashcards: vi.fn().mockResolvedValue([{ Word: 'apple' }]),
}));

vi.mock('@/services/anki-export-service', () => ({
  exportFlashcards: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../components/image-selection-flow', () => ({
  ImageSelectionFlow: ({
    onComplete,
    onBack,
  }: {
    flashcards: Flashcard[];
    onComplete: (f: Flashcard[]) => void;
    onBack: () => void;
  }) => (
    <div data-testid="image-selection-flow">
      <button onClick={() => onComplete([])}>Complete Images</button>
      <button onClick={onBack}>Back from Images</button>
    </div>
  ),
}));

function makeFlashcard(word = 'apple'): Flashcard {
  return {
    id: crypto.randomUUID(),
    noteTypeId: ENGLISH_PICTURE_WORDS.id,
    fieldValues: {
      Word: word,
      Pronunciation: '',
      'Personal Connection, Extra Info': '',
    },
    selectedImages: [],
  };
}

describe('FlashcardGenerator', () => {
  it('shows the word input textarea on initial render (step 1)', () => {
    render(<FlashcardGenerator />);
    expect(screen.getByPlaceholderText(/apple, banana/i)).toBeInTheDocument();
  });

  it('shows step 1 indicator on initial render', () => {
    render(<FlashcardGenerator />);
    expect(screen.getByText('Enter words')).toBeInTheDocument();
  });

  it('transitions from step 1 to step 2 when onGenerate is called', async () => {
    render(<FlashcardGenerator />);

    const textarea = screen.getByPlaceholderText(/apple, banana/i);
    fireEvent.change(textarea, { target: { value: 'apple' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    fireEvent.click(screen.getByRole('button', { name: /create flashcards/i }));

    await waitFor(() => {
      expect(screen.getByTestId('image-selection-flow')).toBeInTheDocument();
    });
  });

  it('transitions back from step 2 to step 1 when back is triggered', async () => {
    render(<FlashcardGenerator />);

    const textarea = screen.getByPlaceholderText(/apple, banana/i);
    fireEvent.change(textarea, { target: { value: 'apple' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));
    fireEvent.click(screen.getByRole('button', { name: /create flashcards/i }));

    await waitFor(() => {
      expect(screen.getByTestId('image-selection-flow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /back from images/i }));
    expect(screen.getByPlaceholderText(/apple, banana/i)).toBeInTheDocument();
  });

  it('transitions from step 2 to step 3 (preview) when images complete', async () => {
    render(<FlashcardGenerator />);

    const textarea = screen.getByPlaceholderText(/apple, banana/i);
    fireEvent.change(textarea, { target: { value: 'apple' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));
    fireEvent.click(screen.getByRole('button', { name: /create flashcards/i }));

    await waitFor(() => {
      expect(screen.getByTestId('image-selection-flow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /complete images/i }));

    expect(screen.getByRole('button', { name: /back to input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('shows "Step 3 of 3" on the preview step', async () => {
    render(<FlashcardGenerator />);

    const textarea = screen.getByPlaceholderText(/apple, banana/i);
    fireEvent.change(textarea, {
      target: { value: makeFlashcard().fieldValues['Word'] },
    });
    fireEvent.change(textarea, { target: { value: 'apple' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));
    fireEvent.click(screen.getByRole('button', { name: /create flashcards/i }));

    await waitFor(() => {
      expect(screen.getByTestId('image-selection-flow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /complete images/i }));

    expect(screen.getByText('Review & export')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { Flashcard, NoteType } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { FlashcardGrid } from '../components/flashcard-grid';

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

const exportFlashcardsMock = vi.fn();
vi.mock('@/services/anki-export-service', () => ({
  exportFlashcards: (...args: unknown[]) => exportFlashcardsMock(...args),
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

const noteType: NoteType = ENGLISH_PICTURE_WORDS;

describe('FlashcardGrid', () => {
  const onEdit = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    onEdit.mockClear();
    onBack.mockClear();
  });

  it('renders the correct number of flashcard preview elements', () => {
    const flashcards = [makeFlashcard('apple'), makeFlashcard('banana'), makeFlashcard('cherry')];
    render(
      <FlashcardGrid flashcards={flashcards} noteType={noteType} onEdit={onEdit} onBack={onBack} />,
    );

    const previewButtons = screen.getAllByRole('button', {
      name: /edit flashcard for/i,
    });
    expect(previewButtons).toHaveLength(3);
  });

  it('renders Back to Input button', () => {
    render(
      <FlashcardGrid
        flashcards={[makeFlashcard('apple')]}
        noteType={noteType}
        onEdit={onEdit}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole('button', { name: /back to input/i })).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(
      <FlashcardGrid
        flashcards={[makeFlashcard('apple')]}
        noteType={noteType}
        onEdit={onEdit}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('calls onBack when Back to Input is clicked', () => {
    render(
      <FlashcardGrid
        flashcards={[makeFlashcard()]}
        noteType={noteType}
        onEdit={onEdit}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /back to input/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders zero preview buttons when given an empty flashcard array', () => {
    render(<FlashcardGrid flashcards={[]} noteType={noteType} onEdit={onEdit} onBack={onBack} />);

    expect(screen.queryAllByRole('button', { name: /edit flashcard for/i })).toHaveLength(0);
  });

  it('shows error message when export fails', async () => {
    const error = new Error('Export failed');
    exportFlashcardsMock.mockRejectedValueOnce(error);

    render(
      <FlashcardGrid
        flashcards={[makeFlashcard()]}
        noteType={noteType}
        onEdit={onEdit}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const deckNameInput = screen.getByLabelText(/deck name/i);
    fireEvent.change(deckNameInput, { target: { value: 'Test Deck' } });

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const errorBanner = await screen.findByText(/export failed/i);
    expect(errorBanner).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { Flashcard, NoteType } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { FlashcardEditor } from '../components/flashcard-editor';

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

function makeFlashcard(word = 'apple'): Flashcard {
  return {
    id: crypto.randomUUID(),
    noteTypeId: ENGLISH_PICTURE_WORDS.id,
    fieldValues: {
      Word: word,
      Pronunciation: '/ˈæpəl/',
      'Personal Connection, Extra Info': 'A red fruit',
    },
    selectedImages: [],
  };
}

const noteType: NoteType = ENGLISH_PICTURE_WORDS;

describe('FlashcardEditor', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onSave.mockClear();
    onClose.mockClear();
  });

  it('renders the dialog when open=true', () => {
    render(
      <FlashcardEditor
        flashcard={makeFlashcard()}
        noteType={noteType}
        open={true}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/edit flashcard/i)).toBeInTheDocument();
  });

  it('does not render dialog content when open=false', () => {
    render(
      <FlashcardEditor
        flashcard={makeFlashcard()}
        noteType={noteType}
        open={false}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dynamic text input fields from noteType', () => {
    render(
      <FlashcardEditor
        flashcard={makeFlashcard('apple')}
        noteType={noteType}
        open={true}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText('Word')).toBeInTheDocument();
    expect(screen.getByLabelText('Pronunciation')).toBeInTheDocument();
  });

  it('renders the textarea field for Personal Connection, Extra Info', () => {
    render(
      <FlashcardEditor
        flashcard={makeFlashcard()}
        noteType={noteType}
        open={true}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText('Personal Connection, Extra Info')).toBeInTheDocument();
  });

  it('calls onSave with updated values when Save is clicked', () => {
    const flashcard = makeFlashcard('apple');
    render(
      <FlashcardEditor
        flashcard={flashcard}
        noteType={noteType}
        open={true}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    const wordInput = screen.getByLabelText('Word');
    fireEvent.change(wordInput, { target: { value: 'mango' } });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: flashcard.id,
        fieldValues: expect.objectContaining({ Word: 'mango' }),
      }),
    );
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <FlashcardEditor
        flashcard={makeFlashcard()}
        noteType={noteType}
        open={true}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

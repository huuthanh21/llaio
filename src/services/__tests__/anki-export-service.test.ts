import { beforeEach, describe, expect, it, vi } from 'vitest';

const createModelMock = vi.fn();
const createDeckMock = vi.fn();
const createPackageMock = vi.fn();
const createNoteMock = vi.fn();

vi.mock('@/services/genanki-service', () => ({
  createModel: (...args: unknown[]) => createModelMock(...args),
  createDeck: (...args: unknown[]) => createDeckMock(...args),
  createPackage: (...args: unknown[]) => createPackageMock(...args),
  createNote: (...args: unknown[]) => createNoteMock(...args),
}));

import { ENGLISH_PICTURE_WORDS, type Flashcard } from '@/models/flashcard';
import { exportFlashcards } from '../anki-export-service';

function makeFlashcard(word = 'apple'): Flashcard {
  return {
    id: crypto.randomUUID(),
    noteTypeId: ENGLISH_PICTURE_WORDS.id,
    fieldValues: {
      Word: word,
      Pronunciation: '/test/',
      'Personal Connection, Extra Info': 'memo',
    },
    selectedImages: [],
  };
}

describe('anki-export-service', () => {
  const deckAddNoteMock = vi.fn();
  const pkgAddDeckMock = vi.fn();
  const pkgWriteToFileMock = vi.fn();
  const pkgAddMediaMock = vi.fn();

  beforeEach(() => {
    createModelMock.mockReset();
    createDeckMock.mockReset();
    createPackageMock.mockReset();
    createNoteMock.mockReset();
    deckAddNoteMock.mockReset();
    pkgAddDeckMock.mockReset();
    pkgWriteToFileMock.mockReset();
    pkgAddMediaMock.mockReset();

    createModelMock.mockReturnValue({});
    createNoteMock.mockImplementation((_model, fields: string[]) => ({ fields }));
    createDeckMock.mockReturnValue({ addNote: deckAddNoteMock });
    createPackageMock.mockReturnValue({
      addDeck: pkgAddDeckMock,
      writeToFile: pkgWriteToFileMock,
      addMedia: pkgAddMediaMock,
    });
  });

  it('returns success for valid flashcards', async () => {
    const result = await exportFlashcards([makeFlashcard('apple')], ENGLISH_PICTURE_WORDS, 'Deck');

    expect(result).toEqual({ ok: true, exportedCount: 1 });
    expect(deckAddNoteMock).toHaveBeenCalledTimes(1);
    expect(pkgWriteToFileMock).toHaveBeenCalledTimes(1);
  });

  it('fails atomically with detailed words when required fields are missing', async () => {
    const invalid = makeFlashcard('apple');
    invalid.fieldValues.Pronunciation = '';

    const result = await exportFlashcards([invalid], ENGLISH_PICTURE_WORDS, 'Deck');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedCount).toBe(1);
      expect(result.failedWords).toEqual(['apple']);
      expect(result.message).toMatch(/fix required fields/i);
    }

    expect(deckAddNoteMock).not.toHaveBeenCalled();
    expect(pkgWriteToFileMock).not.toHaveBeenCalled();
  });

  it('fails atomically and reports all words if export throws', async () => {
    pkgWriteToFileMock.mockImplementationOnce(() => {
      throw new Error('disk error');
    });

    const first = makeFlashcard('apple');
    const second = makeFlashcard('banana');
    const result = await exportFlashcards([first, second], ENGLISH_PICTURE_WORDS, 'Deck');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedCount).toBe(2);
      expect(result.failedWords).toEqual(expect.arrayContaining(['apple', 'banana']));
      expect(result.message).toMatch(/no flashcards were exported/i);
    }
  });

  it('returns failure when flashcard list is empty', async () => {
    const result = await exportFlashcards([], ENGLISH_PICTURE_WORDS, 'Deck');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no flashcards available/i);
      expect(result.failedCount).toBe(0);
      expect(result.failedWords).toEqual([]);
    }
  });
});

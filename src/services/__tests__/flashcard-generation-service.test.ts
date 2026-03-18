import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateFlashcardsMock = vi.fn();

vi.mock('../gemini-service', () => ({
  generateFlashcards: (...args: unknown[]) => generateFlashcardsMock(...args),
}));

import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { generateFlashcardsFromWords } from '../flashcard-generation-service';

describe('flashcard-generation-service', () => {
  beforeEach(() => {
    generateFlashcardsMock.mockReset();
  });

  it('deduplicates and trims words before calling generator', async () => {
    generateFlashcardsMock.mockResolvedValueOnce([{ Word: 'apple' }, { Word: 'banana' }]);

    await generateFlashcardsFromWords({
      words: [' apple ', 'banana', 'apple'],
      apiKey: 'key',
      noteType: ENGLISH_PICTURE_WORDS,
      targetLanguage: 'English',
      nativeLanguage: 'Vietnamese',
    });

    expect(generateFlashcardsMock).toHaveBeenCalledWith(
      ['apple', 'banana'],
      'key',
      ENGLISH_PICTURE_WORDS,
      'English',
      'Vietnamese',
    );
  });

  it('maps generated field values into flashcard objects', async () => {
    generateFlashcardsMock.mockResolvedValueOnce([{ Word: 'apple', Pronunciation: '/a/' }]);

    const result = await generateFlashcardsFromWords({
      words: ['apple'],
      apiKey: 'key',
      noteType: ENGLISH_PICTURE_WORDS,
      targetLanguage: 'English',
      nativeLanguage: 'Vietnamese',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.noteTypeId).toBe(ENGLISH_PICTURE_WORDS.id);
    expect(result[0]?.fieldValues.Word).toBe('apple');
  });

  it('throws when no valid words are provided', async () => {
    await expect(
      generateFlashcardsFromWords({
        words: ['   '],
        apiKey: 'key',
        noteType: ENGLISH_PICTURE_WORDS,
        targetLanguage: 'English',
        nativeLanguage: 'Vietnamese',
      }),
    ).rejects.toThrow(/at least one word/i);
  });
});

import type { Flashcard, NoteType } from '@/models/flashcard';
import type { Language } from '@/stores/language-store';
import { generateFlashcards } from './gemini-service';

interface GenerateFlashcardsFromWordsParams {
  words: string[];
  apiKey: string;
  noteType: NoteType;
  targetLanguage: Language;
  nativeLanguage: Language;
}

function normalizeWords(words: string[]): string[] {
  return [...new Set(words.map((word) => word.trim()).filter((word) => word.length > 0))];
}

export async function generateFlashcardsFromWords({
  words,
  apiKey,
  noteType,
  targetLanguage,
  nativeLanguage,
}: GenerateFlashcardsFromWordsParams): Promise<Flashcard[]> {
  const normalizedWords = normalizeWords(words);
  if (normalizedWords.length === 0) {
    throw new Error('At least one word is required to generate flashcards.');
  }

  const apiResults = await generateFlashcards(
    normalizedWords,
    apiKey,
    noteType,
    targetLanguage,
    nativeLanguage,
  );

  return apiResults.map((fieldValues) => ({
    id: crypto.randomUUID(),
    noteTypeId: noteType.id,
    fieldValues,
    selectedImages: [],
  }));
}

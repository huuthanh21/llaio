import { GenerateContentConfig } from '@google/genai';

export interface GeminiConfig {
  model: string;
  config: GenerateContentConfig;
}

/**
 * Response structure from Gemini for flashcard generation.
 * The fields property contains dynamic field values based on NoteType.
 */
export interface FlashcardApiResponse {
  flashcards: Record<string, string>[];
}

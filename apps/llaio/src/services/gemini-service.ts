import { GoogleGenAI } from '@google/genai';
import type { NoteType } from '@/models/flashcard';
import type { Language } from '@/stores/language-store';
import {
  getFlashcardInstruction,
  getWordDefinitionInstruction,
  getWordPronunciationInstruction,
} from './gemini-config';

export interface FlashcardApiResponse {
  flashcards: Record<string, string>[];
}

interface WordPronunciationApiResponse {
  ipa: string;
}

export async function generateDefinition(
  word: string,
  apiKey: string,
  targetLang: Language,
  nativeLang: Language,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const genAI = new GoogleGenAI({ apiKey });
  const { model, config } = getWordDefinitionInstruction(targetLang, nativeLang);

  const response = await genAI.models.generateContentStream({
    model,
    config,
    contents: [
      {
        role: 'user',
        parts: [{ text: word }],
      },
    ],
  });

  let fullText = '';
  for await (const chunk of response) {
    if (signal?.aborted) {
      break;
    }
    const chunkText = chunk.text || '';
    fullText += chunkText;
    onChunk(fullText);
  }
}

export async function generateFlashcards(
  words: string[],
  apiKey: string,
  noteType: NoteType,
  _targetLang: Language,
  _nativeLang: Language,
): Promise<FlashcardApiResponse['flashcards']> {
  const genAI = new GoogleGenAI({ apiKey });
  const { model, config } = getFlashcardInstruction(noteType);

  const response = await genAI.models.generateContent({
    model,
    config,
    contents: [
      {
        role: 'user',
        parts: [{ text: words.join('; ') }],
      },
    ],
  });

  const text = response.text || '';
  const parsed = JSON.parse(text) as FlashcardApiResponse;
  return parsed.flashcards;
}

export async function generatePronunciationIpa(
  word: string,
  apiKey: string,
  targetLang: Language,
  signal?: AbortSignal,
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });
  const { model, config } = getWordPronunciationInstruction(targetLang);

  const response = await genAI.models.generateContent({
    model,
    config,
    contents: [
      {
        role: 'user',
        parts: [{ text: word }],
      },
    ],
  });

  if (signal?.aborted) {
    return '';
  }

  const text = response.text || '';
  if (!text) {
    return '';
  }

  const parsed = JSON.parse(text) as Partial<WordPronunciationApiResponse>;
  if (typeof parsed.ipa !== 'string') {
    return '';
  }

  return parsed.ipa.trim();
}

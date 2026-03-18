import type { Language } from '@/stores/language-store';

const INTENT_STORAGE_KEY = 'flashcard_generator_intent_v1';

export interface SavedWordsGenerationIntent {
  source: 'saved-words';
  words: string[];
  savedWordIds: string[];
  language: Language;
}

let memoryIntent: SavedWordsGenerationIntent | null = null;

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSavedWordsGenerationIntent(value: unknown): value is SavedWordsGenerationIntent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const intent = value as Partial<SavedWordsGenerationIntent>;
  return (
    intent.source === 'saved-words' &&
    isNonEmptyStringArray(intent.words) &&
    isStringArray(intent.savedWordIds) &&
    typeof intent.language === 'string'
  );
}

export function setSavedWordsGenerationIntent(intent: SavedWordsGenerationIntent): void {
  memoryIntent = intent;

  try {
    sessionStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // ignore
  }
}

export function consumeSavedWordsGenerationIntent(): SavedWordsGenerationIntent | null {
  if (memoryIntent) {
    const intent = memoryIntent;
    memoryIntent = null;
    try {
      sessionStorage.removeItem(INTENT_STORAGE_KEY);
    } catch {
      // ignore
    }
    return intent;
  }

  try {
    const rawValue = sessionStorage.getItem(INTENT_STORAGE_KEY);
    sessionStorage.removeItem(INTENT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (isSavedWordsGenerationIntent(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

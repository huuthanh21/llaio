import { LANGUAGES } from '@/stores';
import type { Language } from '@/stores/language-store';

const SAVED_WORDS_STORAGE_KEY = 'saved_words_v1';
const SAVED_WORDS_CHANGED_EVENT = 'saved-words:changed';

export interface SavedWordEntry {
  id: string;
  word: string;
  normalizedWord: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

interface SavedWordsStorage {
  entries: SavedWordEntry[];
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface SaveWordResult extends ActionResult {
  entry?: SavedWordEntry;
  created?: boolean;
}

export interface RemoveSavedWordResult extends ActionResult {
  removed: boolean;
}

export interface RemoveSavedWordsByIdsResult extends ActionResult {
  removedCount: number;
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.includes(value as Language);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSavedWordEntry(value: unknown): value is SavedWordEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<SavedWordEntry>;
  return (
    isNonEmptyString(entry.id) &&
    isNonEmptyString(entry.word) &&
    isNonEmptyString(entry.normalizedWord) &&
    isLanguage(entry.language) &&
    isNonEmptyString(entry.createdAt) &&
    isNonEmptyString(entry.updatedAt)
  );
}

function toStoragePayload(entries: SavedWordEntry[]): SavedWordsStorage {
  return { entries };
}

function parseStoredEntries(rawValue: string | null): SavedWordEntry[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter(isSavedWordEntry);
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'entries' in parsed &&
      Array.isArray((parsed as SavedWordsStorage).entries)
    ) {
      return (parsed as SavedWordsStorage).entries.filter(isSavedWordEntry);
    }
  } catch {
    return [];
  }

  return [];
}

function readEntries(): SavedWordEntry[] {
  try {
    return parseStoredEntries(localStorage.getItem(SAVED_WORDS_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeEntries(entries: SavedWordEntry[]): ActionResult {
  try {
    localStorage.setItem(SAVED_WORDS_STORAGE_KEY, JSON.stringify(toStoragePayload(entries)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SAVED_WORDS_CHANGED_EVENT));
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Unable to save words in local storage. Please try again.',
    };
  }
}

export function subscribeSavedWordsChanges(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => listener();
  window.addEventListener(SAVED_WORDS_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(SAVED_WORDS_CHANGED_EVENT, handler);
  };
}

function makeEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listSavedWordsByLanguage(language: Language): SavedWordEntry[] {
  return readEntries()
    .filter((entry) => entry.language === language)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function isWordSaved(word: string, language: Language): boolean {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord) {
    return false;
  }

  return readEntries().some(
    (entry) => entry.language === language && entry.normalizedWord === normalizedWord,
  );
}

export function saveWord(word: string, language: Language): SaveWordResult {
  const trimmedWord = word.trim();
  const normalizedWord = normalizeWord(trimmedWord);

  if (!normalizedWord) {
    return {
      ok: false,
      error: 'Word is required.',
    };
  }

  const entries = readEntries();
  const now = new Date().toISOString();
  const existingIndex = entries.findIndex(
    (entry) => entry.language === language && entry.normalizedWord === normalizedWord,
  );

  if (existingIndex >= 0) {
    const existing = entries[existingIndex];
    const updatedEntry: SavedWordEntry = {
      ...existing,
      word: trimmedWord,
      updatedAt: now,
    };
    entries.splice(existingIndex, 1, updatedEntry);

    const writeResult = writeEntries(entries);
    if (!writeResult.ok) {
      return writeResult;
    }

    return {
      ok: true,
      created: false,
      entry: updatedEntry,
    };
  }

  const nextEntry: SavedWordEntry = {
    id: makeEntryId(),
    word: trimmedWord,
    normalizedWord,
    language,
    createdAt: now,
    updatedAt: now,
  };

  const writeResult = writeEntries([nextEntry, ...entries]);
  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    created: true,
    entry: nextEntry,
  };
}

export function removeWord(word: string, language: Language): RemoveSavedWordResult {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord) {
    return { ok: true, removed: false };
  }

  const entries = readEntries();
  const nextEntries = entries.filter(
    (entry) => !(entry.language === language && entry.normalizedWord === normalizedWord),
  );

  if (nextEntries.length === entries.length) {
    return { ok: true, removed: false };
  }

  const writeResult = writeEntries(nextEntries);
  if (!writeResult.ok) {
    return {
      ok: false,
      removed: false,
      error: writeResult.error,
    };
  }

  return { ok: true, removed: true };
}

export function removeSavedWordsByIds(
  ids: string[],
  language: Language,
): RemoveSavedWordsByIdsResult {
  if (ids.length === 0) {
    return {
      ok: true,
      removedCount: 0,
    };
  }

  const idSet = new Set(ids);
  const entries = readEntries();
  let removedCount = 0;
  const nextEntries = entries.filter((entry) => {
    const shouldRemove = entry.language === language && idSet.has(entry.id);
    if (shouldRemove) {
      removedCount += 1;
      return false;
    }
    return true;
  });

  if (removedCount === 0) {
    return {
      ok: true,
      removedCount: 0,
    };
  }

  const writeResult = writeEntries(nextEntries);
  if (!writeResult.ok) {
    return {
      ok: false,
      removedCount: 0,
      error: writeResult.error,
    };
  }

  return {
    ok: true,
    removedCount,
  };
}

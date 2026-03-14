import type { Language } from '@/stores/language-store';

export interface HistoryEntry {
  word: string;
  response: string;
  targetLanguage?: Language;
  nativeLanguage?: Language;
}

const STORAGE_KEY = 'word_lookup_history';
const MAX_HISTORY_SIZE = 20;

function loadHistory(): HistoryEntry[] {
  try {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function getHistory(targetLang: Language, nativeLang: Language): HistoryEntry[] {
  const all = loadHistory();
  return all.filter(
    (entry) => entry.targetLanguage === targetLang && entry.nativeLanguage === nativeLang,
  );
}

export function addEntry(
  word: string,
  response: string,
  targetLang: Language,
  nativeLang: Language,
): void {
  if (!word || !response) {
    return;
  }

  const currentHistory = loadHistory();

  const filteredHistory = currentHistory.filter(
    (entry) =>
      !(
        entry.word.toLowerCase() === word.toLowerCase() &&
        entry.targetLanguage === targetLang &&
        entry.nativeLanguage === nativeLang
      ),
  );

  const newEntry: HistoryEntry = {
    word,
    response,
    targetLanguage: targetLang,
    nativeLanguage: nativeLang,
  };

  const newHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_SIZE);

  saveHistory(newHistory);
}

export function getCachedResponse(
  word: string,
  targetLang: Language,
  nativeLang: Language,
): string | null {
  const all = loadHistory();
  const entry = all.find(
    (e) =>
      e.word.toLowerCase() === word.toLowerCase() &&
      e.targetLanguage === targetLang &&
      e.nativeLanguage === nativeLang,
  );
  return entry?.response ?? null;
}

export function clearHistory(): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

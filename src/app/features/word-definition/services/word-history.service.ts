import { computed, inject, Injectable, signal } from '@angular/core';
import { Language, LanguageStore } from '@core/stores';

export interface HistoryEntry {
  word: string;
  response: string;
  targetLanguage?: Language;
  nativeLanguage?: Language;
}

@Injectable({
  providedIn: 'root',
})
export class WordHistoryService {
  private readonly storageKey = 'word_lookup_history';

  private readonly maxHistorySize = 20;

  private readonly languageStore = inject(LanguageStore);

  private readonly historyEntries = signal<HistoryEntry[]>(this.loadHistory());

  /** Computed signal exposing just the words for display, filtered by current language pair */
  public readonly history = computed(() =>
    this.historyEntries()
      .filter(
        (entry) =>
          entry.targetLanguage === this.languageStore.targetLanguage() &&
          entry.nativeLanguage === this.languageStore.nativeLanguage(),
      )
      .map((entry) => entry.word),
  );

  /**
   * Adds a word and its response to history.
   * If the word already exists for this language pair, it moves to top and updates the response.
   */
  public addToHistory(word: string, response: string): void {
    if (!word || !response) return;

    const currentHistory = this.loadHistory();
    const targetLanguage = this.languageStore.targetLanguage();
    const nativeLanguage = this.languageStore.nativeLanguage();

    const newEntry: HistoryEntry = {
      word,
      response,
      targetLanguage,
      nativeLanguage,
    };

    // Remove existing entry for the SAME language pair if it exists
    const filteredHistory = currentHistory.filter(
      (entry) =>
        !(
          entry.word.toLowerCase() === word.toLowerCase() &&
          entry.targetLanguage === targetLanguage &&
          entry.nativeLanguage === nativeLanguage
        ),
    );

    const newHistory = [newEntry, ...filteredHistory].slice(0, this.maxHistorySize);

    this.saveHistory(newHistory);
  }

  /**
   * Gets the cached response for a word if it exists in history for the CURRENT language pair.
   */
  public getCachedResponse(word: string): string | null {
    const entries = this.historyEntries();
    const targetLanguage = this.languageStore.targetLanguage();
    const nativeLanguage = this.languageStore.nativeLanguage();

    const entry = entries.find(
      (e) =>
        e.word.toLowerCase() === word.toLowerCase() &&
        e.targetLanguage === targetLanguage &&
        e.nativeLanguage === nativeLanguage,
    );
    return entry?.response ?? null;
  }

  public clearHistory(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(this.storageKey);
    }
    this.historyEntries.set([]);
  }

  private loadHistory(): HistoryEntry[] {
    if (!this.isLocalStorageAvailable()) return [];

    const stored = localStorage.getItem(this.storageKey);
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed as HistoryEntry[];
    } catch {
      return [];
    }
  }

  private saveHistory(history: HistoryEntry[]): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
    this.historyEntries.set(history);
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }
}

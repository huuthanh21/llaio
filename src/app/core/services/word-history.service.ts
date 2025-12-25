import { computed, Injectable, signal } from '@angular/core';

export interface HistoryEntry {
  word: string;
  response: string;
}

@Injectable({
  providedIn: 'root',
})
export class WordHistoryService {
  private readonly storageKey = 'word_lookup_history';

  private readonly maxHistorySize = 20;

  private readonly historyEntries = signal<HistoryEntry[]>(this.loadHistory());

  /** Computed signal exposing just the words for display */
  public readonly history = computed(() => this.historyEntries().map((entry) => entry.word));

  /**
   * Adds a word and its response to history.
   * If the word already exists, it moves to top and updates the response.
   */
  public addToHistory(word: string, response: string): void {
    if (!word || !response) return;

    const currentHistory = this.loadHistory();
    const newEntry: HistoryEntry = { word, response };
    const newHistory = [
      newEntry,
      ...currentHistory.filter((entry) => entry.word.toLowerCase() !== word.toLowerCase()),
    ].slice(0, this.maxHistorySize);

    this.saveHistory(newHistory);
  }

  /**
   * Gets the cached response for a word if it exists in history.
   */
  public getCachedResponse(word: string): string | null {
    const entries = this.historyEntries();
    const entry = entries.find((e) => e.word.toLowerCase() === word.toLowerCase());
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
      // Handle migration from old string[] format
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // Old format, clear and return empty
        localStorage.removeItem(this.storageKey);
        return [];
      }
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

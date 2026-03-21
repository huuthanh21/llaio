import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import {
  listSavedWordsByLanguage,
  subscribeSavedWordsChanges,
  type SavedWordEntry,
} from '@/services/saved-words-service';
import { setSavedWordsGenerationIntent } from '@/services/flashcard-generator-intent-service';
import { useLanguageStore } from '@/stores';

export function SavedWordsPage() {
  const navigate = useNavigate();
  const { targetLanguage } = useLanguageStore();

  const [savedWords, setSavedWords] = useState<SavedWordEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNavigatingToGenerator, setIsNavigatingToGenerator] = useState(false);

  const loadSavedWords = useCallback(() => {
    const entries = listSavedWordsByLanguage(targetLanguage);
    setSavedWords(entries);
    setSelectedIds((current) => current.filter((id) => entries.some((entry) => entry.id === id)));
  }, [targetLanguage]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  useEffect(() => {
    setIsNavigatingToGenerator(false);
  }, [targetLanguage]);

  useEffect(() => subscribeSavedWordsChanges(loadSavedWords), [loadSavedWords]);

  const selectedWords = useMemo(
    () => savedWords.filter((entry) => selectedIds.includes(entry.id)),
    [savedWords, selectedIds],
  );

  const allSelected = savedWords.length > 0 && selectedIds.length === savedWords.length;

  const handleToggleSelection = (id: string) => {
    setError(null);
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id);
      }
      return [...current, id];
    });
  };

  const handleToggleSelectAll = () => {
    setError(null);
    setSelectedIds(allSelected ? [] : savedWords.map((entry) => entry.id));
  };

  const handleCreateFlashcards = () => {
    if (selectedWords.length === 0) {
      setError('Select at least one saved word to create flashcards.');
      return;
    }

    setIsNavigatingToGenerator(true);
    setSavedWordsGenerationIntent({
      source: 'saved-words',
      words: selectedWords.map((entry) => entry.word),
      savedWordIds: selectedWords.map((entry) => entry.id),
      language: targetLanguage,
    });

    void navigate({ to: '/flashcard-generator' });
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-heading-24">Saved Words</h2>
          <p className="text-[14px] text-muted-foreground">
            Words saved for <span className="text-foreground">{targetLanguage}</span>
          </p>
        </div>
        <div className="border-border/60 rounded-md border bg-surface-raised px-3 py-2 text-[13px] text-muted-foreground">
          Select saved words, then continue to image selection and export.
        </div>
      </header>

      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-md bg-background-secondary px-1 py-1">
        <Button
          type="button"
          variant="outline"
          onClick={handleToggleSelectAll}
          className="relative overflow-hidden transition-colors"
        >
          <span className="invisible">Clear selection</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="animate-in fade-in zoom-in-95 duration-200">
              {allSelected ? 'Clear selection' : 'Select all'}
            </span>
          </div>
        </Button>
        <Button
          type="button"
          onClick={handleCreateFlashcards}
          disabled={selectedIds.length === 0 || isNavigatingToGenerator}
        >
          <span>
            Create flashcards <span className="tabular-nums">({selectedIds.length})</span>
          </span>
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/20 bg-destructive/5 rounded-md border px-3 py-2.5 text-[14px] text-destructive">
          {error}
        </div>
      ) : null}

      {savedWords.length === 0 ? (
        <div className="border-border/60 bg-surface-raised/40 rounded-lg border border-dashed p-8 text-center">
          <p className="text-[14px] font-medium text-foreground">
            No saved words yet for {targetLanguage}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Save words from Word Definition, then return here to batch-create flashcards.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <ul className="m-0 list-none p-0">
            {savedWords.map((entry) => {
              const checked = selectedIds.includes(entry.id);
              return (
                <li
                  key={entry.id}
                  className="border-border/70 hover:bg-accent/40 flex items-center gap-3 border-b bg-background px-4 py-3 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleSelection(entry.id)}
                    aria-label={`Select ${entry.word}`}
                    className="h-4 w-4 cursor-pointer rounded border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{entry.word}</p>
                    <p className="text-[12px] text-muted-foreground">
                      Saved {new Date(entry.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

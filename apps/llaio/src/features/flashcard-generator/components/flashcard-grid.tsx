import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Flashcard, NoteType } from '@/models/flashcard';
import type { Language } from '@/stores/language-store';
import { removeSavedWordsByIds } from '@/services/saved-words-service';

import { ExportFlashcardsModal } from './export-flashcards-modal';
import { FlashcardEditor } from './flashcard-editor';
import { FlashcardPreview } from './flashcard-preview';

interface FlashcardGridProps {
  flashcards: Flashcard[];
  noteType: NoteType;
  generationSource?: 'manual' | 'saved-words';
  savedWordIds?: string[];
  savedWordsLanguage?: Language | null;
  onSavedWordIdsChange?: (ids: string[]) => void;
  onEdit: (flashcard: Flashcard) => void;
  onBack: () => void;
}

export function FlashcardGrid({
  flashcards,
  noteType,
  generationSource = 'manual',
  savedWordIds = [],
  savedWordsLanguage = null,
  onSavedWordIdsChange,
  onEdit,
  onBack,
}: FlashcardGridProps) {
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(flashcards);
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [lastExportedCount, setLastExportedCount] = useState(0);

  useEffect(() => {
    setLocalFlashcards(flashcards);
  }, [flashcards]);

  const editingFlashcard = useMemo(
    () => localFlashcards.find((card) => card.id === editingFlashcardId) ?? null,
    [editingFlashcardId, localFlashcards],
  );

  const handleOpenEditor = (flashcard: Flashcard) => {
    setEditingFlashcardId(flashcard.id);
  };

  const handleCloseEditor = () => {
    setEditingFlashcardId(null);
  };

  const handleSaveEditedFlashcard = (updated: Flashcard) => {
    setLocalFlashcards((current) =>
      current.map((card) => (card.id === updated.id ? updated : card)),
    );
    onEdit(updated);
    setEditingFlashcardId(null);
  };

  const canShowSavedWordsCleanup =
    generationSource === 'saved-words' && savedWordIds.length > 0 && Boolean(savedWordsLanguage);

  const handleExportSuccess = (exportedCount: number) => {
    setCleanupError(null);
    setLastExportedCount(exportedCount);
    if (canShowSavedWordsCleanup) {
      setShowCleanupDialog(true);
      return;
    }
    onBack();
  };

  const handleKeepSavedWords = () => {
    setShowCleanupDialog(false);
    onBack();
  };

  const handleRemoveSavedWords = () => {
    if (!savedWordsLanguage || savedWordIds.length === 0) {
      setShowCleanupDialog(false);
      onBack();
      return;
    }

    setIsCleaningUp(true);
    setCleanupError(null);

    const result = removeSavedWordsByIds(savedWordIds, savedWordsLanguage);
    if (!result.ok) {
      setCleanupError(result.error ?? 'Failed to remove exported saved words.');
      setIsCleaningUp(false);
      return;
    }

    onSavedWordIdsChange?.([]);
    setIsCleaningUp(false);
    setShowCleanupDialog(false);
    onBack();
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-heading-24">Review Flashcards</h2>
          <p className="text-[14px] text-muted-foreground">
            Review and edit your flashcards before exporting.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to Input
          </Button>
          <Button type="button" onClick={() => setExportModalOpen(true)}>
            Export
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localFlashcards.map((flashcard, index) => (
          <div
            key={flashcard.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <FlashcardPreview
              flashcard={flashcard}
              noteType={noteType}
              onClick={() => handleOpenEditor(flashcard)}
            />
          </div>
        ))}
      </div>

      {editingFlashcard ? (
        <FlashcardEditor
          flashcard={editingFlashcard}
          noteType={noteType}
          open={Boolean(editingFlashcard)}
          onSave={handleSaveEditedFlashcard}
          onClose={handleCloseEditor}
        />
      ) : null}

      <ExportFlashcardsModal
        open={exportModalOpen}
        flashcards={localFlashcards}
        noteType={noteType}
        onExportSuccess={handleExportSuccess}
        onClose={() => setExportModalOpen(false)}
      />

      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export complete</DialogTitle>
            <DialogDescription>
              {lastExportedCount} {lastExportedCount === 1 ? 'flashcard was' : 'flashcards were'}{' '}
              exported. Remove the exported words from Saved Words?
            </DialogDescription>
          </DialogHeader>

          {cleanupError ? (
            <div className="border-destructive/20 bg-destructive/5 rounded-md border px-3 py-2.5 text-[14px] text-destructive">
              {cleanupError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleKeepSavedWords}
              disabled={isCleaningUp}
            >
              Keep saved words
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveSavedWords}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? 'Removing…' : 'Remove exported words'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

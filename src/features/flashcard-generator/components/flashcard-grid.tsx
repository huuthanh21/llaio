import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Flashcard, NoteType } from '@/models/flashcard';

import { ExportFlashcardsModal } from './export-flashcards-modal';
import { FlashcardEditor } from './flashcard-editor';
import { FlashcardPreview } from './flashcard-preview';

interface FlashcardGridProps {
  flashcards: Flashcard[];
  noteType: NoteType;
  onEdit: (flashcard: Flashcard) => void;
  onBack: () => void;
}

export function FlashcardGrid({ flashcards, noteType, onEdit, onBack }: FlashcardGridProps) {
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(flashcards);
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
        onClose={() => setExportModalOpen(false)}
      />
    </section>
  );
}

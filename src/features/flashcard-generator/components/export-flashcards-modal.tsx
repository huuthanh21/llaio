import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Flashcard, NoteType } from '@/models/flashcard';
import { exportFlashcards } from '@/services/anki-export-service';

interface ExportFlashcardsModalProps {
  open: boolean;
  flashcards: Flashcard[];
  noteType: NoteType;
  onClose: () => void;
}

export function ExportFlashcardsModal({
  open,
  flashcards,
  noteType,
  onClose,
}: ExportFlashcardsModalProps) {
  const [deckName, setDeckName] = useState('LLAIO Flashcards');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExport = async () => {
    const normalizedDeckName = deckName.trim();

    if (!normalizedDeckName) {
      setErrorMessage('Deck name is required.');
      setSuccessMessage(null);
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await exportFlashcards(flashcards, noteType, normalizedDeckName);
      setSuccessMessage(`Exported ${flashcards.length} flashcards successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export flashcards.';
      setErrorMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (isExporting) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export to Anki</DialogTitle>
          <DialogDescription>
            Configure deck name and export {flashcards.length} flashcards as .apkg.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="deck-name" className="text-[14px] font-medium">
              Deck name
            </label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="LLAIO Flashcards"
              disabled={isExporting}
            />
          </div>

          {errorMessage ? (
            <div className="border-destructive/20 bg-destructive/5 rounded-md border px-3 py-2.5 text-[14px] text-destructive">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="border-success/20 bg-success/5 rounded-md border px-3 py-2.5 text-[14px] text-success">
              {successMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" className="text-current" />
                Exporting…
              </span>
            ) : (
              'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

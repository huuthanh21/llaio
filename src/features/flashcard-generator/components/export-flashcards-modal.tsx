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
  onExportSuccess?: (exportedCount: number) => void;
  onClose: () => void;
}

export function ExportFlashcardsModal({
  open,
  flashcards,
  noteType,
  onExportSuccess,
  onClose,
}: ExportFlashcardsModalProps) {
  const [deckName, setDeckName] = useState('LLAIO Flashcards');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedWords, setFailedWords] = useState<string[]>([]);

  const handleExport = async () => {
    const normalizedDeckName = deckName.trim();

    if (!normalizedDeckName) {
      setErrorMessage('Deck name is required.');
      setFailedWords([]);
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setFailedWords([]);

    try {
      const result = await exportFlashcards(flashcards, noteType, normalizedDeckName);
      if (result.ok) {
        onExportSuccess?.(result.exportedCount);
        handleClose();
      } else {
        setErrorMessage(result.message);
        setFailedWords(result.failedWords);
      }
    } catch {
      setErrorMessage('Failed to export flashcards.');
      setFailedWords([]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (isExporting) {
      return;
    }

    setErrorMessage(null);
    setFailedWords([]);
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
              <p>{errorMessage}</p>
              {failedWords.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="text-[13px] font-medium text-destructive">
                    {failedWords.length} {failedWords.length === 1 ? 'word failed' : 'words failed'}
                    :
                  </p>
                  <ul className="m-0 max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5">
                    {failedWords.map((word) => (
                      <li key={word} className="text-[13px]">
                        {word}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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

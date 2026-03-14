import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Flashcard, NoteType } from '@/models/flashcard';

import { ImageSelector } from './image-selector';

interface ImageSelectionFlowProps {
  flashcards: Flashcard[];
  noteType: NoteType;
  onComplete: (flashcards: Flashcard[]) => void;
  onBack: () => void;
}

export function ImageSelectionFlow({
  flashcards,
  noteType,
  onComplete,
  onBack,
}: ImageSelectionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updatedFlashcards, setUpdatedFlashcards] = useState<Flashcard[]>(flashcards);

  const totalCards = updatedFlashcards.length;
  const currentFlashcard = updatedFlashcards[currentIndex];

  const moveNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((previousIndex) => previousIndex + 1);
      return;
    }

    onComplete(updatedFlashcards);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((previousIndex) => previousIndex - 1);
      return;
    }

    onBack();
  };

  const handleSelect = (nextFlashcard: Flashcard) => {
    setUpdatedFlashcards((previousFlashcards) =>
      previousFlashcards.map((flashcard, index) =>
        index === currentIndex ? nextFlashcard : flashcard,
      ),
    );
  };

  const handleSkip = () => {
    setUpdatedFlashcards((previousFlashcards) =>
      previousFlashcards.map((flashcard, index) =>
        index === currentIndex ? (flashcards[index] ?? flashcard) : flashcard,
      ),
    );
    moveNext();
  };

  if (!currentFlashcard) {
    return (
      <div className="border-border/60 bg-surface-raised/50 mx-auto w-full max-w-5xl rounded-lg border border-dashed p-8 text-center text-[14px] text-muted-foreground">
        No flashcards available for image selection.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">
          Card <span className="text-foreground">{currentIndex + 1}</span> of {totalCards}
        </p>
        <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-accent">
          <div
            className="rounded-full bg-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      <ImageSelector flashcard={currentFlashcard} noteType={noteType} onSelect={handleSelect} />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button type="button" onClick={moveNext}>
            {currentIndex < totalCards - 1 ? 'Next' : 'Finish'}
          </Button>
        </div>
      </div>
    </div>
  );
}

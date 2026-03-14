import { useState } from 'react';

import type { Flashcard, NoteType } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';

import { FlashcardGrid } from './components/flashcard-grid';
import { ImageSelectionFlow } from './components/image-selection-flow';
import { WordInput } from './components/word-input';

type Step = 'input' | 'images' | 'preview';

const STEP_LABELS: Record<Step, { num: number; label: string }> = {
  input: { num: 1, label: 'Enter words' },
  images: { num: 2, label: 'Select images' },
  preview: { num: 3, label: 'Review & export' },
};

const TOTAL_STEPS = 3;

export function FlashcardGenerator() {
  const [step, setStep] = useState<Step>('input');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [noteType] = useState<NoteType>(ENGLISH_PICTURE_WORDS);

  const handleGenerate = (generated: Flashcard[]) => {
    setFlashcards(generated);
    setStep('images');
  };

  const handleImagesComplete = (updated: Flashcard[]) => {
    setFlashcards(updated);
    setStep('preview');
  };

  const handleEdit = (updatedCard: Flashcard) => {
    setFlashcards((current) =>
      current.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
    );
  };

  const currentStep = STEP_LABELS[step];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {Object.entries(STEP_LABELS).map(([key, { num, label }]) => {
          const isActive = num === currentStep.num;
          const isComplete = num < currentStep.num;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-foreground text-background'
                    : isComplete
                      ? 'bg-accent-active text-foreground'
                      : 'bg-accent text-muted-foreground'
                }`}
              >
                {num}
              </span>
              <span
                className={`hidden text-[13px] sm:inline ${
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {num < TOTAL_STEPS && (
                <div
                  className={`mx-1 hidden h-px w-8 sm:block ${
                    isComplete ? 'bg-border-active' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="animate-content-enter">
        {step === 'input' && <WordInput onGenerate={handleGenerate} />}

        {step === 'images' && (
          <ImageSelectionFlow
            flashcards={flashcards}
            noteType={noteType}
            onComplete={handleImagesComplete}
            onBack={() => setStep('input')}
          />
        )}

        {step === 'preview' && (
          <FlashcardGrid
            flashcards={flashcards}
            noteType={noteType}
            onEdit={handleEdit}
            onBack={() => {
              setStep('input');
              setFlashcards([]);
            }}
          />
        )}
      </div>
    </div>
  );
}

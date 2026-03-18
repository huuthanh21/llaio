import { useEffect, useRef, useState } from 'react';

import type { Flashcard, NoteType } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { Spinner } from '@/components/ui/spinner';
import {
  consumeSavedWordsGenerationIntent,
  type SavedWordsGenerationIntent,
} from '@/services/flashcard-generator-intent-service';
import { generateFlashcardsFromWords } from '@/services/flashcard-generation-service';
import { useLanguageStore, useSettingsStore } from '@/stores';
import type { Language } from '@/stores/language-store';

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
  const { apiKey } = useSettingsStore();
  const { targetLanguage, nativeLanguage } = useLanguageStore();

  const [step, setStep] = useState<Step>('input');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [noteType] = useState<NoteType>(ENGLISH_PICTURE_WORDS);
  const [generationSource, setGenerationSource] = useState<'manual' | 'saved-words'>('manual');
  const [savedWordIds, setSavedWordIds] = useState<string[]>([]);
  const [savedWordsLanguage, setSavedWordsLanguage] = useState<Language | null>(null);
  const [isPreparingSavedWords, setIsPreparingSavedWords] = useState(false);
  const [savedWordsFlowError, setSavedWordsFlowError] = useState<string | null>(null);
  const [savedWordsFlowInfo, setSavedWordsFlowInfo] = useState<string | null>(null);
  const pendingSavedWordsIntentRef = useRef<SavedWordsGenerationIntent | null>(null);

  useEffect(() => {
    const intent = pendingSavedWordsIntentRef.current ?? consumeSavedWordsGenerationIntent();
    if (!intent) {
      return;
    }

    pendingSavedWordsIntentRef.current = intent;

    setGenerationSource('saved-words');
    setSavedWordIds(intent.savedWordIds);
    setSavedWordsLanguage(intent.language);
    setSavedWordsFlowError(null);
    setSavedWordsFlowInfo(
      `Building ${intent.words.length} flashcard${intent.words.length === 1 ? '' : 's'} from your saved ${intent.language} words.`,
    );

    if (!apiKey) {
      setSavedWordsFlowError('Please configure your Google Gemini API key in Settings first.');
      setSavedWordsFlowInfo(null);
      setIsPreparingSavedWords(false);
      return;
    }

    let cancelled = false;
    setIsPreparingSavedWords(true);

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      try {
        const generatedFlashcards = await generateFlashcardsFromWords({
          words: intent.words,
          apiKey,
          noteType,
          targetLanguage,
          nativeLanguage,
        });

        if (cancelled) {
          return;
        }

        setFlashcards(generatedFlashcards);
        setStep('images');
        setSavedWordsFlowInfo(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSavedWordsFlowError(
          error instanceof Error
            ? error.message
            : 'Failed to generate flashcards from saved words.',
        );
        setSavedWordsFlowInfo(null);
      } finally {
        if (!cancelled) {
          setIsPreparingSavedWords(false);
          pendingSavedWordsIntentRef.current = null;
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey, nativeLanguage, noteType, targetLanguage]);

  const handleGenerate = (generated: Flashcard[]) => {
    setGenerationSource('manual');
    setSavedWordIds([]);
    setSavedWordsLanguage(null);
    setSavedWordsFlowError(null);
    setSavedWordsFlowInfo(null);
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

      {isPreparingSavedWords ? (
        <div className="border-border/60 flex flex-col gap-2 rounded-lg border bg-surface-raised p-6">
          <div className="flex items-center gap-3 text-[14px] text-foreground">
            <Spinner size="sm" />
            <span className="font-medium">Preparing flashcards from Saved Words</span>
          </div>
          {savedWordsFlowInfo ? (
            <p className="text-[13px] text-muted-foreground">{savedWordsFlowInfo}</p>
          ) : null}
        </div>
      ) : null}

      {savedWordsFlowError ? (
        <div className="border-destructive/20 bg-destructive/5 rounded-md border px-4 py-3 text-[14px] text-destructive">
          {savedWordsFlowError}
        </div>
      ) : null}

      {generationSource === 'saved-words' && step !== 'input' ? (
        <div className="border-border/60 bg-surface-raised/60 rounded-md border px-3 py-2 text-[13px] text-muted-foreground">
          Source: Saved Words ({savedWordsLanguage ?? targetLanguage}) - {savedWordIds.length}{' '}
          selected
        </div>
      ) : null}

      <div className="animate-content-enter">
        {step === 'input' && !isPreparingSavedWords && <WordInput onGenerate={handleGenerate} />}

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
            generationSource={generationSource}
            savedWordIds={savedWordIds}
            savedWordsLanguage={savedWordsLanguage}
            onSavedWordIdsChange={setSavedWordIds}
            onEdit={handleEdit}
            onBack={() => {
              setStep('input');
              setFlashcards([]);
              setGenerationSource('manual');
              setSavedWordIds([]);
              setSavedWordsLanguage(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

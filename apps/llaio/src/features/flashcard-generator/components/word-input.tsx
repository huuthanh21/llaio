import { useState } from 'react';
import { Info, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Flashcard } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { generateFlashcardsFromWords } from '@/services/flashcard-generation-service';
import { useLanguageStore, useSettingsStore } from '@/stores';

export interface WordInputProps {
  onGenerate: (flashcards: Flashcard[]) => void;
}

export function WordInput({ onGenerate }: WordInputProps) {
  const [inputText, setInputText] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { apiKey } = useSettingsStore();
  const { targetLanguage, nativeLanguage } = useLanguageStore();

  const handleParseWords = () => {
    const parsed = [
      ...new Set(
        inputText
          .split(/[\s,]+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 0),
      ),
    ];
    setWords(parsed);
  };

  const handleRemoveWord = (indexToRemove: number) => {
    setWords((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleClearWords = () => {
    setWords([]);
  };

  const handleSubmit = async () => {
    if (words.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const newFlashcards = await generateFlashcardsFromWords({
        words,
        apiKey,
        noteType: ENGLISH_PICTURE_WORDS,
        targetLanguage,
        nativeLanguage,
      });

      onGenerate(newFlashcards);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating flashcards.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-8">
        <div className="space-y-1.5">
          <h2 className="text-heading-20">Flashcard Generator</h2>
          <p className="text-[14px] text-muted-foreground">
            Enter words separated by commas, whitespace, or new lines
          </p>
        </div>

        <div className="bg-accent/60 flex items-start gap-3 rounded-md px-4 py-3 text-[13px] text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>Currently optimized for English vocabulary. Multi-language support coming soon.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Textarea
            className="min-h-32 resize-none font-mono text-[13px]"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="apple, banana, cherry&#10;dog, cat, bird"
            name="words"
          />
          <Button className="w-full justify-center" onClick={handleParseWords} variant="secondary">
            Parse Words
          </Button>
        </div>

        {error && (
          <div className="border-destructive/20 bg-destructive/5 rounded-md border px-4 py-3 text-[14px] text-destructive">
            {error}
          </div>
        )}

        {words.length > 0 && (
          <div className="flex animate-content-enter flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-medium">
                {words.length} {words.length === 1 ? 'word' : 'words'} parsed
              </p>
              <Button
                className="h-8 px-2 text-muted-foreground"
                onClick={handleClearWords}
                variant="ghost"
                size="sm"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {words.map((word, index) => (
                <Badge
                  key={`${word}-${index}`}
                  className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1.5 text-[13px] font-normal"
                  variant="secondary"
                >
                  {word}
                  <button
                    className="text-foreground/40 hover:bg-destructive/10 focus-visible:ring-ring/40 flex size-5 cursor-pointer items-center justify-center rounded border-none bg-transparent transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2"
                    aria-label={`Remove ${word}`}
                    onClick={() => handleRemoveWord(index)}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              className="w-full justify-center"
              disabled={isGenerating}
              onClick={handleSubmit}
            >
              {isGenerating ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Generating…
                </>
              ) : (
                'Create Flashcards'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

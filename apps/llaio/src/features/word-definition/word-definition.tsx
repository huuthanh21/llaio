import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { Bookmark, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { generateDefinition, generatePronunciationIpa } from '@/services/gemini-service';
import {
  addEntry,
  getCachedEntry,
  getHistory,
  type HistoryEntry,
  updateEntryIpa,
} from '@/services/word-history-service';
import {
  isWordSaved,
  removeWord,
  saveWord,
  subscribeSavedWordsChanges,
} from '@/services/saved-words-service';
import { playPronunciation } from '@/services/pronunciation-service';
import { useLanguageStore, useSettingsStore } from '@/stores';
import { ContentStatus } from './content-status';

marked.setOptions({ async: false });

type DefinitionStatus = 'idle' | 'loading' | 'error' | 'success';

export function WordDefinition() {
  const { apiKey } = useSettingsStore();
  const { targetLanguage, nativeLanguage } = useLanguageStore();

  const [inputWord, setInputWord] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [ipa, setIpa] = useState('');
  const [status, setStatus] = useState<DefinitionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);
  const [isPronunciationLoading, setIsPronunciationLoading] = useState(false);
  const [isPronunciationPlaying, setIsPronunciationPlaying] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pronunciationAudioRef = useRef<HTMLAudioElement | null>(null);
  const pronunciationAudioUrlRef = useRef<string | null>(null);
  const pronunciationRequestRef = useRef(0);

  const historyWords = useMemo(() => {
    return history.map((entry) => entry.word);
  }, [history]);

  const markedHtml = useMemo(() => {
    if (!definition) {
      return '';
    }
    return marked.parse(definition) as string;
  }, [definition]);

  const releasePronunciationAudioUrl = useCallback(() => {
    if (!pronunciationAudioUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(pronunciationAudioUrlRef.current);
    pronunciationAudioUrlRef.current = null;
  }, []);

  const stopPronunciationPlayback = useCallback(() => {
    const currentAudio = pronunciationAudioRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.onended = null;
      currentAudio.onerror = null;
      pronunciationAudioRef.current = null;
    }

    releasePronunciationAudioUrl();
    setIsPronunciationPlaying(false);
  }, [releasePronunciationAudioUrl]);

  const loadHistory = useCallback(() => {
    const entries = getHistory(targetLanguage, nativeLanguage);
    setHistory(entries);
  }, [targetLanguage, nativeLanguage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const trimmedWord = currentWord.trim();
    if (!trimmedWord) {
      setIsSaved(false);
      return;
    }

    setIsSaved(isWordSaved(trimmedWord, targetLanguage));
  }, [targetLanguage, currentWord]);

  useEffect(
    () =>
      subscribeSavedWordsChanges(() => {
        const trimmedWord = currentWord.trim();
        if (!trimmedWord) {
          return;
        }
        setIsSaved(isWordSaved(trimmedWord, targetLanguage));
      }),
    [targetLanguage, currentWord],
  );

  useEffect(() => {
    return () => {
      pronunciationRequestRef.current += 1;
      abortControllerRef.current?.abort();
      stopPronunciationPlayback();
    };
  }, [stopPronunciationPlayback]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    pronunciationRequestRef.current += 1;
    stopPronunciationPlayback();
    setInputWord('');
    setCurrentWord('');
    setDefinition('');
    setIpa('');
    setError(null);
    setSaveError(null);
    setPronunciationError(null);
    setIsPronunciationLoading(false);
    setStatus('idle');
  }, [targetLanguage, nativeLanguage, stopPronunciationPlayback]);

  const runDefinition = async (inputWord: string) => {
    const trimmedWord = inputWord.trim();
    if (!trimmedWord) {
      return;
    }

    if (!apiKey) {
      setStatus('error');
      setError('Please configure your Google Gemini API key in Settings first.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setInputWord(trimmedWord);
    setCurrentWord(trimmedWord);
    setStatus('loading');
    setError(null);
    setDefinition('');
    setIpa('');
    setPronunciationError(null);
    setIsPronunciationLoading(false);
    stopPronunciationPlayback();
    pronunciationRequestRef.current += 1;
    let streamedText = '';
    let latestIpa = '';
    let hasSavedHistoryEntry = false;

    try {
      const ipaTask = generatePronunciationIpa(
        trimmedWord,
        apiKey,
        targetLanguage,
        controller.signal,
      )
        .then((value) => {
          if (controller.signal.aborted) {
            return '';
          }

          const normalizedIpa = value.trim();
          latestIpa = normalizedIpa;
          setIpa(normalizedIpa);
          if (normalizedIpa && hasSavedHistoryEntry) {
            updateEntryIpa(trimmedWord, targetLanguage, nativeLanguage, normalizedIpa);
            loadHistory();
          }
          return normalizedIpa;
        })
        .catch(() => {
          return '';
        });

      await generateDefinition(
        trimmedWord,
        apiKey,
        targetLanguage,
        nativeLanguage,
        (text) => {
          streamedText = text;
          setDefinition(text);
        },
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      setStatus('success');

      if (streamedText.trim().length > 0) {
        addEntry(trimmedWord, streamedText, targetLanguage, nativeLanguage, latestIpa || undefined);
        hasSavedHistoryEntry = true;
        loadHistory();
      }

      void ipaTask;
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setStatus('error');
      setError('Failed to fetch definition. Please check your API key and connection.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleDefine = async () => {
    await runDefinition(inputWord);
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    pronunciationRequestRef.current += 1;
    stopPronunciationPlayback();
    setInputWord('');
    setCurrentWord('');
    setDefinition('');
    setIpa('');
    setError(null);
    setSaveError(null);
    setPronunciationError(null);
    setIsPronunciationLoading(false);
    setStatus('idle');
  };

  const canSaveWord = status === 'success' && currentWord.trim().length > 0;

  const handleToggleSavedWord = () => {
    if (!canSaveWord) {
      return;
    }

    const trimmedWord = currentWord.trim();
    const result = isSaved
      ? removeWord(trimmedWord, targetLanguage)
      : saveWord(trimmedWord, targetLanguage);

    if (!result.ok) {
      setSaveError(result.error ?? 'Failed to update saved words.');
      return;
    }

    setSaveError(null);
    setIsSaved(!isSaved);
  };

  const handleSelectHistory = (selectedWord: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    pronunciationRequestRef.current += 1;
    stopPronunciationPlayback();
    setPronunciationError(null);
    setIsPronunciationLoading(false);
    setInputWord(selectedWord);
    setCurrentWord(selectedWord);
    setIpa('');
    const cachedEntry = getCachedEntry(selectedWord, targetLanguage, nativeLanguage);
    if (cachedEntry?.response) {
      setDefinition(cachedEntry.response);
      setIpa(cachedEntry?.ipa ?? '');
      setError(null);
      setStatus('success');
    }
  };

  const handlePlayPronunciation = async () => {
    const trimmedWord = currentWord.trim();
    if (!trimmedWord || status !== 'success') {
      return;
    }

    const requestId = pronunciationRequestRef.current + 1;
    pronunciationRequestRef.current = requestId;

    setPronunciationError(null);
    setIsPronunciationLoading(true);
    stopPronunciationPlayback();

    const result = await playPronunciation(trimmedWord, targetLanguage);
    if (pronunciationRequestRef.current !== requestId) {
      if (result.audioUrl) {
        URL.revokeObjectURL(result.audioUrl);
      }
      return;
    }

    if (!result.ok || !result.audioUrl) {
      setIsPronunciationLoading(false);
      setIsPronunciationPlaying(false);
      setPronunciationError(
        result.error ?? 'Unable to play pronunciation audio right now. Please try again.',
      );
      return;
    }

    pronunciationAudioUrlRef.current = result.audioUrl;
    const audio = new Audio(result.audioUrl);
    pronunciationAudioRef.current = audio;

    audio.onended = () => {
      setIsPronunciationPlaying(false);
      pronunciationAudioRef.current = null;
      releasePronunciationAudioUrl();
    };

    audio.onerror = () => {
      setIsPronunciationPlaying(false);
      setPronunciationError('Unable to play pronunciation audio right now. Please try again.');
      pronunciationAudioRef.current = null;
      releasePronunciationAudioUrl();
    };

    try {
      await audio.play();
      setIsPronunciationPlaying(true);
    } catch {
      setIsPronunciationPlaying(false);
      setPronunciationError('Your browser blocked audio playback. Click again to retry.');
      pronunciationAudioRef.current = null;
      releasePronunciationAudioUrl();
    } finally {
      setIsPronunciationLoading(false);
    }
  };

  const showStreaming = status === 'loading' && definition.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Search area */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={inputWord}
            onChange={(event) => setInputWord(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleDefine();
              }
            }}
            placeholder="e.g. Serendipity"
            className="h-11 flex-1 text-[15px]"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => {
                void handleDefine();
              }}
              disabled={status === 'loading' || !inputWord.trim()}
              className="relative h-11 flex-1 overflow-hidden transition-all sm:flex-initial sm:px-6"
            >
              <span
                className={cn(
                  'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  status === 'loading' ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
                )}
              >
                Define
              </span>
              {status === 'loading' && (
                <div className="absolute inset-0 flex animate-fade-in items-center justify-center">
                  <Spinner size="sm" className="text-current" />
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={!inputWord && !definition && status === 'idle'}
              className="h-11 w-11 shrink-0 transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4 transition-transform active:-rotate-45" />
            </Button>

            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              onClick={handleToggleSavedWord}
              disabled={!canSaveWord}
              className="relative h-11 px-3 transition-colors"
            >
              <span className="invisible flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Save word
              </span>
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <Bookmark
                  className={cn(
                    'h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isSaved ? 'fill-current text-foreground' : 'fill-transparent',
                  )}
                />
                <span className="animate-fade-in">{isSaved ? 'Saved' : 'Save word'}</span>
              </div>
            </Button>
          </div>
        </div>

        {saveError ? (
          <div className="border-destructive/20 bg-destructive/5 animate-fade-in rounded-md border px-3 py-2.5 text-[14px] text-destructive">
            {saveError}
          </div>
        ) : null}

        {historyWords.length > 0 && (
          <div className="flex animate-fade-in">
            <Select onValueChange={handleSelectHistory}>
              <SelectTrigger className="h-9 w-full text-[13px] sm:w-64">
                <SelectValue placeholder="Recent words" />
              </SelectTrigger>
              <SelectContent>
                {historyWords.map((historyWord) => (
                  <SelectItem key={historyWord} value={historyWord}>
                    {historyWord}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Definition content */}
      <ContentStatus status={status} error={error} hasContent={definition.trim().length > 0}>
        <div className="border-border/60 animate-content-enter rounded-lg border bg-surface-raised p-6">
          <div className="border-border/40 mb-6 flex items-start justify-between gap-4 border-b pb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-3xl font-bold tracking-tight text-foreground">
                  {currentWord}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    void handlePlayPronunciation();
                  }}
                  disabled={isPronunciationLoading || status !== 'success' || !currentWord.trim()}
                  aria-label={`Play pronunciation for ${currentWord.trim()}`}
                  title={`Pronounce in ${targetLanguage}`}
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-full transition-all duration-300',
                    isPronunciationPlaying
                      ? 'hover:bg-foreground/90 bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {isPronunciationLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Volume2
                      className={cn(
                        'size-5 transition-transform duration-300',
                        isPronunciationPlaying && 'scale-110',
                      )}
                    />
                  )}
                </Button>
              </div>
              {ipa ? (
                <p className="mt-1.5 font-mono text-[15px] tracking-tight text-muted-foreground">
                  {ipa}
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                  Pronunciation
                </p>
              )}
            </div>
          </div>

          {pronunciationError ? (
            <div className="border-destructive/20 bg-destructive/5 mb-4 rounded-md border px-3 py-2 text-[13px] text-destructive">
              {pronunciationError}
            </div>
          ) : null}

          <div
            className="prose max-w-none dark:prose-invert prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: markedHtml }}
          />
          {showStreaming && <span className="streaming-cursor" aria-hidden="true" />}
        </div>
      </ContentStatus>
    </div>
  );
}

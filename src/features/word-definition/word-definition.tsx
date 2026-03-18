import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { Bookmark, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { generateDefinition } from '@/services/gemini-service';
import {
  addEntry,
  getCachedResponse,
  getHistory,
  type HistoryEntry,
} from '@/services/word-history-service';
import {
  isWordSaved,
  removeWord,
  saveWord,
  subscribeSavedWordsChanges,
} from '@/services/saved-words-service';
import { useLanguageStore, useSettingsStore } from '@/stores';
import { ContentStatus } from './content-status';

marked.setOptions({ async: false });

type DefinitionStatus = 'idle' | 'loading' | 'error' | 'success';

export function WordDefinition() {
  const { apiKey } = useSettingsStore();
  const { targetLanguage, nativeLanguage } = useLanguageStore();

  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [status, setStatus] = useState<DefinitionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const historyWords = useMemo(() => {
    return history.map((entry) => entry.word);
  }, [history]);

  const markedHtml = useMemo(() => {
    if (!definition) {
      return '';
    }
    return marked.parse(definition) as string;
  }, [definition]);

  const loadHistory = useCallback(() => {
    const entries = getHistory(targetLanguage, nativeLanguage);
    setHistory(entries);
  }, [targetLanguage, nativeLanguage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const trimmedWord = word.trim();
    if (!trimmedWord) {
      setIsSaved(false);
      return;
    }

    setIsSaved(isWordSaved(trimmedWord, targetLanguage));
  }, [targetLanguage, word]);

  useEffect(
    () =>
      subscribeSavedWordsChanges(() => {
        const trimmedWord = word.trim();
        if (!trimmedWord) {
          return;
        }
        setIsSaved(isWordSaved(trimmedWord, targetLanguage));
      }),
    [targetLanguage, word],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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

    setWord(trimmedWord);
    setStatus('loading');
    setError(null);
    setDefinition('');
    let streamedText = '';

    try {
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
        addEntry(trimmedWord, streamedText, targetLanguage, nativeLanguage);
        loadHistory();
      }
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
    await runDefinition(word);
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setWord('');
    setDefinition('');
    setError(null);
    setSaveError(null);
    setStatus('idle');
  };

  const canSaveWord = status === 'success' && word.trim().length > 0;

  const handleToggleSavedWord = () => {
    if (!canSaveWord) {
      return;
    }

    const trimmedWord = word.trim();
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
    setWord(selectedWord);
    const cached = getCachedResponse(selectedWord, targetLanguage, nativeLanguage);
    if (cached) {
      setDefinition(cached);
      setError(null);
      setStatus('success');
    }
  };

  const showStreaming = status === 'loading' && definition.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Search area */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={word}
            onChange={(event) => setWord(event.target.value)}
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
              disabled={status === 'loading' || !word.trim()}
              className="h-11 flex-1 sm:flex-initial sm:px-6"
            >
              {status === 'loading' ? <Spinner size="sm" variant="contrast" /> : 'Define'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-11 w-11 shrink-0"
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              onClick={handleToggleSavedWord}
              disabled={!canSaveWord}
              className="h-11 px-3"
            >
              <Bookmark className="h-4 w-4" />
              {isSaved ? 'Saved' : 'Save word'}
            </Button>
          </div>
        </div>

        {saveError ? (
          <div className="border-destructive/20 bg-destructive/5 rounded-md border px-3 py-2.5 text-[14px] text-destructive">
            {saveError}
          </div>
        ) : null}

        {historyWords.length > 0 && (
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
        )}
      </div>

      {/* Definition content */}
      <ContentStatus status={status} error={error} hasContent={definition.trim().length > 0}>
        <div className="border-border/60 animate-content-enter rounded-lg border bg-surface-raised p-6">
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

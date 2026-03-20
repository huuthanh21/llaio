import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clipboard, ImagePlus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Flashcard, FlashcardImage, NoteType } from '@/models/flashcard';
import { searchImages } from '@/services/image-search-service';
import type { ImageSearchResult } from '@/services/image-search-service';
import { GOOGLE_CSE_ID, useSettingsStore } from '@/stores';

interface ImageSelectorProps {
  flashcard: Flashcard;
  noteType: NoteType;
  onSelect: (flashcard: Flashcard) => void;
}

const MAX_CUSTOM_IMAGES = 2;
const IMAGE_RESULTS_PAGE_SIZE = 10;
const INITIAL_RESULTS_START = 1;

function mergeUniqueSearchResults(
  currentResults: ImageSearchResult[],
  nextResults: ImageSearchResult[],
): ImageSearchResult[] {
  const seenLinks = new Set<string>();

  return [...currentResults, ...nextResults].filter((result) => {
    if (seenLinks.has(result.link)) {
      return false;
    }

    seenLinks.add(result.link);
    return true;
  });
}

function getWordFromFlashcard(flashcard: Flashcard, noteType: NoteType): string {
  const firstField = noteType.fields[0];

  if (!firstField) {
    return '';
  }

  return flashcard.fieldValues[firstField.name] ?? '';
}

function isPastedImage(image: FlashcardImage): boolean {
  // Keep URL-prefix fallback for flashcards saved before `source` metadata existed.
  return image.source === 'pasted' || image.url.startsWith('data:image/');
}

function toFlashcardImage(result: ImageSearchResult): FlashcardImage {
  return {
    id: result.link,
    url: result.link,
    thumbnail: result.thumbnailLink,
    title: 'Selected image',
    source: 'search',
  };
}

function fileToFlashcardImage(file: File): Promise<FlashcardImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Unsupported image format.'));
        return;
      }

      resolve({
        id: dataUrl,
        url: dataUrl,
        thumbnail: dataUrl,
        title: file.name || 'Pasted image',
        source: 'pasted',
      });
    };

    reader.onerror = () => {
      reject(new Error('Could not process the pasted image.'));
    };

    reader.readAsDataURL(file);
  });
}

function resolveSelectedImages(
  selectedUrls: string[],
  searchResults: ImageSearchResult[],
  pastedImages: FlashcardImage[],
  existingSelected: FlashcardImage[],
): FlashcardImage[] {
  return selectedUrls.map((url) => {
    const fromPasted = pastedImages.find((image) => image.url === url);
    if (fromPasted) {
      return fromPasted;
    }

    const fromResults = searchResults.find((result) => result.link === url);
    if (fromResults) {
      return toFlashcardImage(fromResults);
    }

    const fromExisting = existingSelected.find((image) => image.url === url);
    if (fromExisting) {
      return fromExisting;
    }

    return {
      id: url,
      url,
      thumbnail: url,
      title: 'Selected image',
    };
  });
}

export function ImageSelector({ flashcard, noteType, onSelect }: ImageSelectorProps) {
  const { googleCseApiKey } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<ImageSearchResult[]>([]);
  const [pastedImages, setPastedImages] = useState<FlashcardImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextStart, setNextStart] = useState(INITIAL_RESULTS_START);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchSessionRef = useRef(0);
  const loadMoreRequestRef = useRef(0);

  const cardWord = useMemo(() => getWordFromFlashcard(flashcard, noteType), [flashcard, noteType]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      const sessionId = searchSessionRef.current + 1;
      searchSessionRef.current = sessionId;
      loadMoreRequestRef.current += 1;
      setIsLoadingMore(false);

      if (!trimmedQuery) {
        setIsLoading(false);
        setImages([]);
        setSearchError(null);
        setLoadMoreError(null);
        setHasMoreResults(false);
        setNextStart(INITIAL_RESULTS_START);
        setActiveSearchQuery('');
        return;
      }

      if (!googleCseApiKey) {
        setIsLoading(false);
        setImages([]);
        setSearchError('Google CSE API key is missing. Add it in Settings to search images.');
        setLoadMoreError(null);
        setHasMoreResults(false);
        setNextStart(INITIAL_RESULTS_START);
        setActiveSearchQuery('');
        return;
      }

      setIsLoading(true);
      setSearchError(null);
      setLoadMoreError(null);

      try {
        const results = await searchImages(
          trimmedQuery,
          googleCseApiKey,
          GOOGLE_CSE_ID,
          INITIAL_RESULTS_START,
        );

        if (searchSessionRef.current !== sessionId) {
          return;
        }

        setImages(results);
        setActiveSearchQuery(trimmedQuery);
        setHasMoreResults(results.length === IMAGE_RESULTS_PAGE_SIZE);
        setNextStart(INITIAL_RESULTS_START + results.length);
      } catch (err) {
        if (searchSessionRef.current !== sessionId) {
          return;
        }

        if (err instanceof Error) {
          setSearchError(err.message);
        } else {
          setSearchError('Image search failed. Please try again.');
        }

        setHasMoreResults(false);
        setNextStart(INITIAL_RESULTS_START);
        setActiveSearchQuery('');
      } finally {
        if (searchSessionRef.current === sessionId) {
          setIsLoading(false);
        }
      }
    },
    [googleCseApiKey],
  );

  useEffect(() => {
    const initialQuery = cardWord.trim();
    setSearchQuery(initialQuery);
    setPastedImages(flashcard.selectedImages.filter((image) => isPastedImage(image)));
    setSelectedImages(flashcard.selectedImages.map((image) => image.url));
    setPasteError(null);
    void runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardWord, flashcard.id, runSearch]);

  const emitSelectedFlashcard = useCallback(
    (nextSelectedUrls: string[]) => {
      const nextSelectedImages = resolveSelectedImages(
        nextSelectedUrls,
        images,
        pastedImages,
        flashcard.selectedImages,
      );

      onSelect({
        ...flashcard,
        selectedImages: nextSelectedImages,
      });
    },
    [flashcard, images, onSelect, pastedImages],
  );

  const handleToggleImage = useCallback(
    (imageUrl: string) => {
      setSelectedImages((previousSelected) => {
        const isSelected = previousSelected.includes(imageUrl);

        let nextSelected = previousSelected;
        if (isSelected) {
          nextSelected = previousSelected.filter((selectedUrl) => selectedUrl !== imageUrl);
        } else if (previousSelected.length < MAX_CUSTOM_IMAGES) {
          nextSelected = [...previousSelected, imageUrl];
        }

        if (nextSelected !== previousSelected) {
          emitSelectedFlashcard(nextSelected);
        }

        return nextSelected;
      });
    },
    [emitSelectedFlashcard],
  );

  const handleSearch = useCallback(async () => {
    await runSearch(searchQuery);
  }, [runSearch, searchQuery]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMoreResults || !activeSearchQuery || !googleCseApiKey) {
      return;
    }

    const requestId = loadMoreRequestRef.current + 1;
    loadMoreRequestRef.current = requestId;
    const sessionId = searchSessionRef.current;
    const requestQuery = activeSearchQuery;
    const requestStart = nextStart;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const results = await searchImages(
        requestQuery,
        googleCseApiKey,
        GOOGLE_CSE_ID,
        requestStart,
      );

      if (loadMoreRequestRef.current !== requestId || searchSessionRef.current !== sessionId) {
        return;
      }

      setImages((previousImages) => mergeUniqueSearchResults(previousImages, results));
      setHasMoreResults(results.length === IMAGE_RESULTS_PAGE_SIZE);
      setNextStart((previousStart) => previousStart + results.length);
    } catch (error) {
      if (loadMoreRequestRef.current !== requestId || searchSessionRef.current !== sessionId) {
        return;
      }

      if (error instanceof Error) {
        setLoadMoreError(error.message);
      } else {
        setLoadMoreError('Could not load more images. Please try again.');
      }
    } finally {
      if (loadMoreRequestRef.current === requestId) {
        setIsLoadingMore(false);
      }
    }
  }, [activeSearchQuery, googleCseApiKey, hasMoreResults, isLoading, isLoadingMore, nextStart]);

  const appendPastedFiles = useCallback(async (files: File[]) => {
    setPasteError(null);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setPasteError('No image found. Paste or choose image files only.');
      return;
    }

    try {
      const nextImages = await Promise.all(imageFiles.map((file) => fileToFlashcardImage(file)));
      setPastedImages((previousImages) => [...previousImages, ...nextImages]);
    } catch (error) {
      if (error instanceof Error) {
        setPasteError(error.message);
      } else {
        setPasteError('Could not process the pasted image.');
      }
    }
  }, []);

  useEffect(() => {
    const onWindowPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) {
        return;
      }

      const activeElement = document.activeElement;
      const isTypingContext =
        activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      const isContentEditable =
        activeElement instanceof HTMLElement && activeElement.isContentEditable;

      if (!isTypingContext && !isContentEditable) {
        event.preventDefault();
      }

      void appendPastedFiles(files);
    };

    window.addEventListener('paste', onWindowPaste);
    return () => {
      window.removeEventListener('paste', onWindowPaste);
    };
  }, [appendPastedFiles]);

  const allImages = useMemo(() => {
    const mergedImages = [...pastedImages, ...images.map((image) => toFlashcardImage(image))];
    const seenUrls = new Set<string>();

    return mergedImages.filter((image) => {
      if (seenUrls.has(image.url)) {
        return false;
      }
      seenUrls.add(image.url);
      return true;
    });
  }, [images, pastedImages]);

  const showLoadMoreControl =
    !isLoading &&
    !searchError &&
    images.length > 0 &&
    (hasMoreResults || isLoadingMore || !!loadMoreError);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-medium tracking-tight text-foreground">
          {cardWord || 'Flashcard'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_CUSTOM_IMAGES} images to illustrate this card.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground/60 absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              className="focus-visible:ring-foreground/20 h-10 pl-9 shadow-none transition-shadow focus-visible:ring-1"
              placeholder="Search for images"
            />
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => void handleSearch()}
            className="h-10 px-6 shadow-none transition-transform active:scale-[0.98]"
          >
            Search
          </Button>
        </div>

        <div className="border-border/60 bg-surface-raised/30 hover:bg-surface-raised/50 group flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors hover:border-border-hover">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 shadow-none"
            >
              <ImagePlus className="mr-2 size-4" />
              Choose image
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2 text-border-hover">•</span>
              <Clipboard className="mr-1.5 size-4" />
              <span>Paste with Ctrl/Cmd + V</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                void appendPastedFiles(files);
              }
              event.currentTarget.value = '';
            }}
          />
        </div>

        <p className="border-border/40 border-b pb-2 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{selectedImages.length}</span> /{' '}
          {MAX_CUSTOM_IMAGES} images selected
        </p>

        {pasteError ? (
          <div className="bg-destructive/10 border-destructive/20 rounded-lg border px-4 py-3 text-sm text-destructive shadow-sm">
            {pasteError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="border-border/40 bg-surface-raised/20 flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
            <Spinner size="md" className="text-muted-foreground/50" />
          </div>
        ) : null}

        {!isLoading && searchError ? (
          <div className="bg-destructive/10 border-destructive/20 rounded-lg border px-4 py-3 text-sm text-destructive shadow-sm">
            {searchError}
          </div>
        ) : null}

        {!isLoading && !searchError && allImages.length === 0 ? (
          <div className="border-border/40 bg-surface-raised/20 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            <Search className="text-muted-foreground/30 mb-2 size-6" />
            <p>No images found</p>
            <p className="text-muted-foreground/60 text-xs">
              Try searching for something else or upload an image.
            </p>
          </div>
        ) : null}

        {!isLoading && allImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {allImages.map((image) => {
              const isSelected = selectedImages.includes(image.url);
              const disableNewSelection = !isSelected && selectedImages.length >= MAX_CUSTOM_IMAGES;

              return (
                <button
                  key={image.url}
                  type="button"
                  aria-label={`Select image ${image.title}`}
                  className={`group relative aspect-[4/3] w-full overflow-hidden rounded-md border transition-all duration-300 ease-out ${
                    isSelected
                      ? 'border-foreground ring-1 ring-foreground ring-offset-1 ring-offset-background'
                      : 'border-border/60 hover:border-border-hover hover:shadow-sm'
                  } ${disableNewSelection ? 'cursor-not-allowed opacity-50 grayscale-[0.5]' : 'cursor-pointer'}`}
                  onClick={() => handleToggleImage(image.url)}
                  disabled={disableNewSelection}
                >
                  <img
                    src={image.thumbnail || image.url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {isSelected ? (
                    <div className="bg-background/20 absolute inset-0 flex items-center justify-center backdrop-blur-[1px] transition-all duration-300">
                      <div className="animate-in zoom-in-50 flex size-7 items-center justify-center rounded-full bg-foreground text-background shadow-md shadow-black/10 duration-200">
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {showLoadMoreControl ? (
          <div className="flex flex-col items-center pb-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              className="border-border/80 min-w-[140px] shadow-none transition-all hover:bg-surface-raised active:scale-[0.98]"
            >
              {isLoadingMore ? (
                <>
                  <Spinner size="sm" className="mr-2 opacity-70" />
                  <span className="text-muted-foreground">Loading...</span>
                </>
              ) : (
                'Load more images'
              )}
            </Button>

            {loadMoreError ? (
              <div className="bg-destructive/10 border-destructive/20 mt-3 rounded-lg border px-4 py-2.5 text-sm text-destructive shadow-sm">
                {loadMoreError}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

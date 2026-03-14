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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardWord = useMemo(() => getWordFromFlashcard(flashcard, noteType), [flashcard, noteType]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setImages([]);
        setSearchError(null);
        return;
      }

      if (!googleCseApiKey) {
        setImages([]);
        setSearchError('Google CSE API key is missing. Add it in Settings to search images.');
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      try {
        const results = await searchImages(trimmedQuery, googleCseApiKey, GOOGLE_CSE_ID);
        setImages(results);
      } catch (err) {
        if (err instanceof Error) {
          setSearchError(err.message);
        } else {
          setSearchError('Image search failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
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

  const appendPastedFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        setPasteError('No image found. Paste or choose image files only.');
        return;
      }

      const remainingSlots = MAX_CUSTOM_IMAGES - pastedImages.length;
      if (remainingSlots <= 0) {
        setPasteError(
          `You have reached the limit of ${MAX_CUSTOM_IMAGES} of your own images per flashcard.`,
        );
        return;
      }

      const filesToProcess = imageFiles.slice(0, remainingSlots);

      try {
        const nextImages = await Promise.all(
          filesToProcess.map((file) => fileToFlashcardImage(file)),
        );
        setPastedImages((previousImages) => [...previousImages, ...nextImages]);
        setPasteError(
          imageFiles.length > remainingSlots
            ? `Only the first ${remainingSlots} pasted image${remainingSlots > 1 ? 's were' : ' was'} added.`
            : null,
        );
      } catch (error) {
        if (error instanceof Error) {
          setPasteError(error.message);
        } else {
          setPasteError('Could not process the pasted image.');
        }
      }
    },
    [pastedImages.length],
  );

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
    const mergedImages = [
      ...pastedImages,
      ...images.map((image) => ({
        id: image.link,
        url: image.link,
        thumbnail: image.thumbnailLink || image.link,
        title: 'Selected image',
      })),
    ];
    const seenUrls = new Set<string>();

    return mergedImages.filter((image) => {
      if (seenUrls.has(image.url)) {
        return false;
      }
      seenUrls.add(image.url);
      return true;
    });
  }, [images, pastedImages]);

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-heading-20">{cardWord || 'Flashcard'}</h3>
        <p className="text-[14px] text-muted-foreground">
          Select up to {MAX_CUSTOM_IMAGES} images for this flashcard.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search for images"
          />
          <Button type="button" variant="secondary" onClick={() => void handleSearch()}>
            <Search className="size-4" />
            Search
          </Button>
        </div>

        <div className="border-border/60 bg-surface-raised/50 space-y-3 rounded-lg border border-dashed p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Choose image
            </Button>
            <span className="text-[13px] text-muted-foreground">
              <Clipboard className="mr-1 inline size-3.5 align-[-2px]" />
              Paste with Ctrl/Cmd + V
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Add up to {MAX_CUSTOM_IMAGES} of your own images for this card. Works on desktop and
            mobile file pickers.
          </p>
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

        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{selectedImages.length}</span> /{' '}
          {MAX_CUSTOM_IMAGES} images selected
        </p>

        {pasteError ? (
          <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4 text-[14px] text-destructive">
            {pasteError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="border-border/60 bg-surface-raised/50 flex min-h-56 items-center justify-center rounded-lg border border-dashed">
            <Spinner size="md" />
          </div>
        ) : null}

        {!isLoading && searchError ? (
          <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4 text-[14px] text-destructive">
            {searchError}
          </div>
        ) : null}

        {!isLoading && !searchError && allImages.length === 0 ? (
          <div className="border-border/60 bg-surface-raised/50 rounded-lg border border-dashed p-8 text-center text-[14px] text-muted-foreground">
            No images yet. Search, paste, or choose images to continue.
          </div>
        ) : null}

        {!isLoading && allImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {allImages.map((image) => {
              const isSelected = selectedImages.includes(image.url);
              const disableNewSelection = !isSelected && selectedImages.length >= MAX_CUSTOM_IMAGES;

              return (
                <button
                  key={image.url}
                  type="button"
                  aria-label={`Select image ${image.title}`}
                  className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                    isSelected
                      ? 'ring-foreground/15 border-foreground ring-2 ring-offset-2 ring-offset-background'
                      : 'border-border hover:border-border-hover hover:shadow-sm'
                  } ${disableNewSelection ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                  onClick={() => handleToggleImage(image.url)}
                  disabled={disableNewSelection}
                >
                  <img
                    src={image.thumbnail || image.url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {isSelected ? (
                    <div className="bg-foreground/25 absolute inset-0 flex items-center justify-center">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
                        <Check className="size-4" />
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

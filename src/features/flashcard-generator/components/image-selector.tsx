import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';

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

function getWordFromFlashcard(flashcard: Flashcard, noteType: NoteType): string {
  const firstField = noteType.fields[0];

  if (!firstField) {
    return '';
  }

  return flashcard.fieldValues[firstField.name] ?? '';
}

function toFlashcardImage(result: ImageSearchResult): FlashcardImage {
  return {
    id: result.link,
    url: result.link,
    thumbnail: result.thumbnailLink,
    title: 'Selected image',
  };
}

function resolveSelectedImages(
  selectedUrls: string[],
  searchResults: ImageSearchResult[],
  existingSelected: FlashcardImage[],
): FlashcardImage[] {
  return selectedUrls.map((url) => {
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardWord = useMemo(() => getWordFromFlashcard(flashcard, noteType), [flashcard, noteType]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setImages([]);
        setError(null);
        return;
      }

      if (!googleCseApiKey) {
        setImages([]);
        setError('Google CSE API key is missing. Add it in Settings to search images.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchImages(trimmedQuery, googleCseApiKey, GOOGLE_CSE_ID);
        setImages(results);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Image search failed. Please try again.');
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
    setSelectedImages(flashcard.selectedImages.map((image) => image.url));
    void runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardWord, flashcard.id, runSearch]);

  const emitSelectedFlashcard = useCallback(
    (nextSelectedUrls: string[]) => {
      const nextSelectedImages = resolveSelectedImages(
        nextSelectedUrls,
        images,
        flashcard.selectedImages,
      );

      onSelect({
        ...flashcard,
        selectedImages: nextSelectedImages,
      });
    },
    [flashcard, images, onSelect],
  );

  const handleToggleImage = useCallback(
    (imageUrl: string) => {
      setSelectedImages((previousSelected) => {
        const isSelected = previousSelected.includes(imageUrl);

        let nextSelected = previousSelected;
        if (isSelected) {
          nextSelected = previousSelected.filter((selectedUrl) => selectedUrl !== imageUrl);
        } else if (previousSelected.length < 2) {
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

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-heading-20">{cardWord || 'Flashcard'}</h3>
        <p className="text-[14px] text-muted-foreground">
          Select up to 2 images for this flashcard.
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

        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{selectedImages.length}</span> / 2 images
          selected
        </p>

        {isLoading ? (
          <div className="border-border/60 bg-surface-raised/50 flex min-h-56 items-center justify-center rounded-lg border border-dashed">
            <Spinner size="md" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4 text-[14px] text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && images.length === 0 ? (
          <div className="border-border/60 bg-surface-raised/50 rounded-lg border border-dashed p-8 text-center text-[14px] text-muted-foreground">
            No images found. Try a different search term.
          </div>
        ) : null}

        {!isLoading && !error && images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((image) => {
              const isSelected = selectedImages.includes(image.link);
              const disableNewSelection = !isSelected && selectedImages.length >= 2;

              return (
                <button
                  key={image.link}
                  type="button"
                  className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                    isSelected
                      ? 'ring-foreground/15 border-foreground ring-2 ring-offset-2 ring-offset-background'
                      : 'border-border hover:border-border-hover hover:shadow-sm'
                  } ${disableNewSelection ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                  onClick={() => handleToggleImage(image.link)}
                  disabled={disableNewSelection}
                >
                  <img
                    src={image.thumbnailLink || image.link}
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

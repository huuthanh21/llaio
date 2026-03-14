import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Flashcard } from '@/models/flashcard';
import { ENGLISH_PICTURE_WORDS } from '@/models/flashcard';
import { ImageSelector } from '../components/image-selector';

const searchImagesMock = vi.fn();

vi.mock('@/services/image-search-service', () => ({
  searchImages: (...args: unknown[]) => searchImagesMock(...args),
}));

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    googleCseApiKey: 'test-gkey',
  }),
  GOOGLE_CSE_ID: 'test-cse-id',
}));

function makeFlashcard(word = 'apple'): Flashcard {
  return {
    id: crypto.randomUUID(),
    noteTypeId: ENGLISH_PICTURE_WORDS.id,
    fieldValues: {
      Word: word,
      Pronunciation: '',
      'Personal Connection, Extra Info': '',
    },
    selectedImages: [],
  };
}

describe('ImageSelector', () => {
  const originalFileReader = globalThis.FileReader;

  beforeEach(() => {
    searchImagesMock.mockResolvedValue([]);

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

      readAsDataURL(file: Blob): void {
        const source = file instanceof File ? file.name : 'image';
        this.result = `data:image/png;base64,${Buffer.from(source).toString('base64')}`;
        this.onload?.call(
          this as unknown as FileReader,
          new ProgressEvent('load') as ProgressEvent<FileReader>,
        );
      }
    }

    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
  });

  it('renders paste and file picker controls', async () => {
    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /choose image/i })).toBeInTheDocument();
    expect(screen.getByText(/paste with ctrl\/cmd \+ v/i)).toBeInTheDocument();
    await waitFor(() => expect(searchImagesMock).toHaveBeenCalled());
  });

  it('adds pasted images from clipboard and allows selecting up to 2', async () => {
    const onSelect = vi.fn();
    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={onSelect}
      />,
    );

    const imageFile = new File(['image-1'], 'pasted-1.png', { type: 'image/png' });
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { files: [imageFile] },
    });

    window.dispatchEvent(pasteEvent);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(1),
    );
    fireEvent.click(screen.getByRole('button', { name: /select image pasted-1\.png/i }));

    expect(onSelect).toHaveBeenCalled();
    const selectedFlashcard = onSelect.mock.calls[onSelect.mock.calls.length - 1]?.[0] as Flashcard;
    expect(selectedFlashcard.selectedImages).toHaveLength(1);
    expect(selectedFlashcard.selectedImages[0]?.source).toBe('pasted');
  });

  it('limits own images to 2 when choosing files', async () => {
    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          new File(['image-1'], 'first.png', { type: 'image/png' }),
          new File(['image-2'], 'second.png', { type: 'image/png' }),
          new File(['image-3'], 'third.png', { type: 'image/png' }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/only the first 2 pasted images were added/i)).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(2);
  });
});

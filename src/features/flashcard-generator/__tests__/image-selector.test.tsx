import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

function makeSearchResults(count: number, start = 1) {
  return Array.from({ length: count }, (_, index) => {
    const id = start + index;

    return {
      link: `https://images.example/${id}.jpg`,
      thumbnailLink: `https://images.example/${id}-thumb.jpg`,
    };
  });
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

    act(() => {
      window.dispatchEvent(pasteEvent);
    });

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(1),
    );
    fireEvent.click(screen.getByRole('button', { name: /select image pasted-1\.png/i }));

    expect(onSelect).toHaveBeenCalled();
    const selectedFlashcard = onSelect.mock.calls[onSelect.mock.calls.length - 1]?.[0] as Flashcard;
    expect(selectedFlashcard.selectedImages).toHaveLength(1);
    expect(selectedFlashcard.selectedImages[0]?.source).toBe('pasted');
  });

  it('allows choosing more than 2 files while keeping selection capped at 2', async () => {
    const onSelect = vi.fn();
    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={onSelect}
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

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(3),
    );

    const imageButtons = screen.getAllByRole('button', { name: /select image/i });
    fireEvent.click(imageButtons[0] as HTMLButtonElement);
    fireEvent.click(imageButtons[1] as HTMLButtonElement);

    expect(
      screen.getByText((_, element) => element?.textContent === '2 / 2 images selected'),
    ).toBeInTheDocument();
    expect(imageButtons[2]).toBeDisabled();
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('allows adding more pasted images even when 2 are already selected', async () => {
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

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(3),
    );

    let imageButtons = screen.getAllByRole('button', { name: /select image/i });
    fireEvent.click(imageButtons[0] as HTMLButtonElement);
    fireEvent.click(imageButtons[1] as HTMLButtonElement);

    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [new File(['image-4'], 'fourth.png', { type: 'image/png' })],
      },
    });

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(4),
    );

    expect(screen.queryByText(/reached the limit/i)).not.toBeInTheDocument();
    imageButtons = screen.getAllByRole('button', { name: /select image/i });
    expect(imageButtons[3]).toBeDisabled();
  });

  it('appends next-page search results when load more is clicked', async () => {
    searchImagesMock.mockImplementation((_: string, __: string, ___: string, start?: number) => {
      if ((start ?? 1) === 1) {
        return Promise.resolve(makeSearchResults(10, 1));
      }

      if (start === 11) {
        return Promise.resolve(makeSearchResults(2, 11));
      }

      return Promise.resolve([]);
    });

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(10),
    );
    const loadMoreButton = screen.getByRole('button', { name: /load more images/i });

    fireEvent.click(loadMoreButton);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(12),
    );
    expect(screen.queryByRole('button', { name: /load more images/i })).not.toBeInTheDocument();

    expect(
      searchImagesMock.mock.calls.some(
        (call) =>
          call[0] === 'apple' &&
          call[1] === 'test-gkey' &&
          call[2] === 'test-cse-id' &&
          call[3] === 11,
      ),
    ).toBe(true);
  });

  it('keeps selected and existing images after loading more results', async () => {
    const onSelect = vi.fn();
    searchImagesMock.mockImplementation((_: string, __: string, ___: string, start?: number) => {
      if ((start ?? 1) === 1) {
        return Promise.resolve(makeSearchResults(10, 1));
      }

      if (start === 11) {
        return Promise.resolve(makeSearchResults(2, 11));
      }

      return Promise.resolve([]);
    });

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={onSelect}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(10),
    );

    let imageButtons = screen.getAllByRole('button', { name: /select image/i });
    fireEvent.click(imageButtons[0] as HTMLButtonElement);

    expect(
      screen.getByText((_, element) => element?.textContent === '1 / 2 images selected'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load more images/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(12),
    );
    expect(
      screen.getByText((_, element) => element?.textContent === '1 / 2 images selected'),
    ).toBeInTheDocument();

    imageButtons = screen.getAllByRole('button', { name: /select image/i });
    expect(imageButtons[0]).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('disables load-more while loading and hides it when no more results are available', async () => {
    let resolveLoadMore: ((value: ReturnType<typeof makeSearchResults>) => void) | undefined;

    searchImagesMock.mockImplementation((_: string, __: string, ___: string, start?: number) => {
      if ((start ?? 1) === 1) {
        return Promise.resolve(makeSearchResults(10, 1));
      }

      if (start === 11) {
        return new Promise((resolve) => {
          resolveLoadMore = resolve;
        });
      }

      return Promise.resolve([]);
    });

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    const loadMoreButton = await screen.findByRole('button', { name: /load more images/i });
    const initialLoadMoreCalls = searchImagesMock.mock.calls.filter(
      (call) => call[3] === 11,
    ).length;

    fireEvent.click(loadMoreButton);
    await waitFor(() =>
      expect(searchImagesMock.mock.calls.filter((call) => call[3] === 11)).toHaveLength(
        initialLoadMoreCalls + 1,
      ),
    );
    expect(loadMoreButton).toBeDisabled();
    expect(loadMoreButton).toHaveTextContent(/loading/i);

    const loadMoreCallsAfterFirstClick = searchImagesMock.mock.calls.filter(
      (call) => call[3] === 11,
    ).length;
    fireEvent.click(loadMoreButton);
    expect(searchImagesMock.mock.calls.filter((call) => call[3] === 11)).toHaveLength(
      loadMoreCallsAfterFirstClick,
    );

    await act(async () => {
      resolveLoadMore?.([]);
    });

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /load more images/i })).not.toBeInTheDocument(),
    );
  });

  it('does not render load-more control when first page has fewer than 10 results', async () => {
    searchImagesMock.mockResolvedValueOnce(makeSearchResults(3, 1));

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(3),
    );
    expect(screen.queryByRole('button', { name: /load more images/i })).not.toBeInTheDocument();
  });

  it('shows load-more errors, keeps current results, and allows retry', async () => {
    let loadMoreAttemptCount = 0;

    searchImagesMock.mockImplementation((_: string, __: string, ___: string, start?: number) => {
      if ((start ?? 1) === 1) {
        return Promise.resolve(makeSearchResults(10, 1));
      }

      if (start === 11) {
        loadMoreAttemptCount += 1;
        if (loadMoreAttemptCount === 1) {
          return Promise.reject(new Error('Rate limited'));
        }

        return Promise.resolve(makeSearchResults(1, 11));
      }

      return Promise.resolve([]);
    });

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(10),
    );

    fireEvent.click(screen.getByRole('button', { name: /load more images/i }));

    await waitFor(() => expect(screen.getByText('Rate limited')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(10);

    fireEvent.click(screen.getByRole('button', { name: /load more images/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(11),
    );
    expect(screen.queryByText('Rate limited')).not.toBeInTheDocument();

    expect(
      searchImagesMock.mock.calls.filter((call) => call[3] === 11).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('ignores stale load-more responses after a new search starts', async () => {
    let resolveLoadMore: ((value: ReturnType<typeof makeSearchResults>) => void) | undefined;

    searchImagesMock.mockImplementation((query: string, _: string, __: string, start?: number) => {
      const effectiveStart = start ?? 1;

      if (query === 'apple' && effectiveStart === 1) {
        return Promise.resolve(makeSearchResults(10, 1));
      }

      if (query === 'apple' && effectiveStart === 11) {
        return new Promise((resolve) => {
          resolveLoadMore = resolve;
        });
      }

      if (query === 'banana' && effectiveStart === 1) {
        return Promise.resolve(makeSearchResults(3, 101));
      }

      return Promise.resolve([]);
    });

    render(
      <ImageSelector
        flashcard={makeFlashcard()}
        noteType={ENGLISH_PICTURE_WORDS}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(10),
    );

    const loadMoreButton = await screen.findByRole('button', { name: /load more images/i });
    fireEvent.click(loadMoreButton);
    await waitFor(() => expect(loadMoreButton).toBeDisabled());

    fireEvent.change(screen.getByPlaceholderText(/search for images/i), {
      target: { value: 'banana' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(3),
    );
    expect(screen.queryByRole('button', { name: /load more images/i })).not.toBeInTheDocument();

    await act(async () => {
      resolveLoadMore?.(makeSearchResults(2, 11));
    });

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /select image/i })).toHaveLength(3),
    );
  });
});

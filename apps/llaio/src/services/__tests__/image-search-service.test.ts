import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchImages } from '../image-search-service';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

function makeResponse(body: unknown, ok: boolean, status = 200, statusText = 'OK') {
  return {
    ok,
    status,
    statusText,
    json: () => Promise.resolve(body),
  };
}

describe('searchImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a URL with q, cx, key, searchType=image, num=10', async () => {
    mockFetch.mockResolvedValue(makeResponse({ items: [] }, true));

    await searchImages('cat', 'test-key', 'test-cx-id');

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl: string = mockFetch.mock.calls[0][0];
    const url = new URL(calledUrl);
    expect(url.searchParams.get('q')).toBe('cat');
    expect(url.searchParams.get('cx')).toBe('test-cx-id');
    expect(url.searchParams.get('key')).toBe('test-key');
    expect(url.searchParams.get('searchType')).toBe('image');
    expect(url.searchParams.get('num')).toBe('10');
  });

  it('uses start=1 by default', async () => {
    mockFetch.mockResolvedValue(makeResponse({ items: [] }, true));

    await searchImages('dog', 'key', 'cx');

    const calledUrl: string = mockFetch.mock.calls[0][0];
    const url = new URL(calledUrl);
    expect(url.searchParams.get('start')).toBe('1');
  });

  it('passes start param when provided', async () => {
    mockFetch.mockResolvedValue(makeResponse({ items: [] }, true));

    await searchImages('bird', 'key', 'cx', 11);

    const calledUrl: string = mockFetch.mock.calls[0][0];
    const url = new URL(calledUrl);
    expect(url.searchParams.get('start')).toBe('11');
  });

  it('returns mapped ImageSearchResult array from items', async () => {
    const items = [
      {
        title: 'Cat',
        link: 'https://example.com/cat.jpg',
        image: { thumbnailLink: 'https://example.com/thumb.jpg' },
      },
      {
        title: 'Dog',
        link: 'https://example.com/dog.jpg',
        image: { thumbnailLink: 'https://example.com/dog-thumb.jpg' },
      },
    ];
    mockFetch.mockResolvedValue(makeResponse({ items }, true));

    const result = await searchImages('animals', 'key', 'cx');

    expect(result).toEqual([
      {
        link: 'https://example.com/cat.jpg',
        thumbnailLink: 'https://example.com/thumb.jpg',
      },
      {
        link: 'https://example.com/dog.jpg',
        thumbnailLink: 'https://example.com/dog-thumb.jpg',
      },
    ]);
  });

  it('falls back to link when thumbnailLink is missing', async () => {
    const items = [{ title: 'Cat', link: 'https://example.com/cat.jpg', image: {} }];
    mockFetch.mockResolvedValue(makeResponse({ items }, true));

    const result = await searchImages('cat', 'key', 'cx');

    expect(result).toEqual([
      {
        link: 'https://example.com/cat.jpg',
        thumbnailLink: 'https://example.com/cat.jpg',
      },
    ]);
  });

  it('falls back to link when image field is missing entirely', async () => {
    const items = [{ title: 'Cat', link: 'https://example.com/cat.jpg' }];
    mockFetch.mockResolvedValue(makeResponse({ items }, true));

    const result = await searchImages('cat', 'key', 'cx');

    expect(result).toEqual([
      {
        link: 'https://example.com/cat.jpg',
        thumbnailLink: 'https://example.com/cat.jpg',
      },
    ]);
  });

  it('returns empty array when items is absent', async () => {
    mockFetch.mockResolvedValue(makeResponse({}, true));

    const result = await searchImages('nothing', 'key', 'cx');

    expect(result).toEqual([]);
  });

  it('returns empty array when items is empty', async () => {
    mockFetch.mockResolvedValue(makeResponse({ items: [] }, true));

    const result = await searchImages('empty', 'key', 'cx');

    expect(result).toEqual([]);
  });

  it('throws when response is not ok (HTTP 400)', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: 'Bad Request' }, false, 400, 'Bad Request'));

    await expect(searchImages('error', 'key', 'cx')).rejects.toThrow('400');
  });

  it('throws when response is not ok (HTTP 403)', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: 'Forbidden' }, false, 403, 'Forbidden'));

    await expect(searchImages('error', 'bad-key', 'cx')).rejects.toThrow('403');
  });

  it('throws when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    await expect(searchImages('fail', 'key', 'cx')).rejects.toThrow('Network failure');
  });
});

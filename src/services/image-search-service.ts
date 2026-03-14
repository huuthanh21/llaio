/**
 * ImageSearchResult type for Google Custom Search API responses
 */
export interface ImageSearchResult {
  link: string;
  thumbnailLink: string;
}

/**
 * Internal type for parsing Google Custom Search API response
 */
interface GoogleSearchResult {
  items?: {
    title: string;
    link: string;
    image?: {
      thumbnailLink?: string;
    };
  }[];
}

/**
 * Search for images via Google Custom Search API
 * @param query - The search query string
 * @param apiKey - Google CSE API key
 * @param cseId - Custom Search Engine ID
 * @param start - Starting index for pagination (default: 1)
 * @returns Promise resolving to array of ImageSearchResult objects
 * @throws Error if response is not OK or has missing fields
 */
export async function searchImages(
  query: string,
  apiKey: string,
  cseId: string,
  start?: number,
): Promise<ImageSearchResult[]> {
  const startIndex = start ?? 1;

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('q', query);
  url.searchParams.set('cx', cseId);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('searchType', 'image');
  url.searchParams.set('num', '10');
  url.searchParams.set('start', String(startIndex));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Custom Search API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GoogleSearchResult;

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => ({
    link: item.link,
    thumbnailLink: item.image?.thumbnailLink ?? item.link,
  }));
}

import { inject, Injectable, signal } from '@angular/core';
import { GOOGLE_CSE_SEARCH_ENGINE_ID, SettingsStore } from '../../../core/stores/settings.store';
import { FlashcardImage } from '../models/flashcard.types';

interface GoogleSearchResult {
  items?: {
    title: string;
    link: string;
    image?: {
      thumbnailLink?: string;
    };
  }[];
}

export const IMAGES_PER_PAGE = 10;

/**
 * Service for searching images via Google Custom Search API.
 * Falls back to placeholder images when API key is not configured.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageSearchService {
  private readonly settingsStore = inject(SettingsStore);

  public readonly isLoading = signal(false);

  /**
   * Search for images by query using Google Custom Search API.
   * Falls back to mock images if API is not configured.
   */
  public async searchImages(query: string, start = 1): Promise<FlashcardImage[]> {
    const apiKey = this.settingsStore.googleCseApiKey?.();

    if (!apiKey) {
      console.error('Google Custom Search API key not configured');
      return [];
    }

    this.isLoading.set(true);

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('cx', GOOGLE_CSE_SEARCH_ENGINE_ID);
      url.searchParams.set('q', query);
      url.searchParams.set('searchType', 'image');
      url.searchParams.set('num', String(IMAGES_PER_PAGE));
      url.searchParams.set('start', String(start));

      const response = await fetch(url.toString());
      const data = (await response.json()) as GoogleSearchResult;

      if (!data.items) {
        throw new Error('No images found');
      }

      // Domains that block direct image fetching
      const blockedDomains = ['instagram.com', 'fbsbx.com', 'fbcdn.net', 'cdninstagram.com'];
      const isBlockedUrl = (link: string): boolean =>
        blockedDomains.some((domain) => link.includes(domain));

      return data.items.map((item, index) => {
        const thumbnail = item.image?.thumbnailLink || item.link;
        // Use thumbnail for blocked domains, otherwise use full link
        const imageUrl = isBlockedUrl(item.link) ? thumbnail : item.link;

        return {
          id: `${query}-${start}-${index}`,
          url: imageUrl,
          thumbnail,
          title: item.title,
        };
      });
    } catch (error) {
      console.log(error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetch an image and convert to base64 for embedding in Anki package.
   */
  public async fetchImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}

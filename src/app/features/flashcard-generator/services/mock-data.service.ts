import { Injectable } from '@angular/core';
import { FlashcardImage, FlashcardTemplate } from '../models/flashcard.types';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  public generateMockImages(query: string, offset = 0): FlashcardImage[] {
    const encodedQuery = encodeURIComponent(query);
    // Using placehold.co for better reliable placeholder images
    const baseImages: FlashcardImage[] = [
      {
        id: `${query}-${offset}-1`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Photo+1`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Photo+1`,
        title: `${query} - Image 1`,
      },
      {
        id: `${query}-${offset}-2`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Photo+2`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Photo+2`,
        title: `${query} - Image 2`,
      },
      {
        id: `${query}-${offset}-3`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Illustration`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Illustration`,
        title: `${query} - Illustration`,
      },
      {
        id: `${query}-${offset}-4`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Diagram`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Diagram`,
        title: `${query} - Diagram`,
      },
      {
        id: `${query}-${offset}-5`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Icon`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Icon`,
        title: `${query} - Icon`,
      },
      {
        id: `${query}-${offset}-6`,
        url: `https://placehold.co/600x400?text=${encodedQuery}+Example`,
        thumbnail: `https://placehold.co/300x200?text=${encodedQuery}+Example`,
        title: `${query} - Example`,
      },
    ];

    return baseImages; // Return array directly to match mock behavior
  }

  public getFlashcardTemplate(word: string): FlashcardTemplate {
    return {
      word: word,
      definition: `Definition of ${word}`,
      example: `Example sentence using ${word}`,
      imagePrompt: word,
    };
  }

  public generateMockFlashcards(words: string[]): FlashcardTemplate[] {
    return words.map((word) => this.getFlashcardTemplate(word));
  }
}

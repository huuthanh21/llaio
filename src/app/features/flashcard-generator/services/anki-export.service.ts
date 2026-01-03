import { inject, Injectable, isDevMode } from '@angular/core';
import { GenankiService } from '../../../core/services/genanki.service';
import { Flashcard } from '../models/flashcard.types';
import { NoteType } from '../models/note-type.model';

/**
 * Service for exporting flashcards to Anki .apkg format using GenankiService.
 */
@Injectable({
  providedIn: 'root',
})
export class AnkiExportService {
  private readonly genankiService = inject(GenankiService);

  /**
   * Export flashcards to an Anki .apkg file.
   */
  public async exportToApkg(
    flashcards: Flashcard[],
    noteType: NoteType,
    deckName: string,
  ): Promise<void> {
    const genanki = this.genankiService.genanki;
    if (!genanki) {
      throw new Error('Genanki library not loaded. Please refresh the page.');
    }

    // Create the Anki Model from NoteType
    const model = this.genankiService.createModel({
      name: noteType.name,
      id: noteType.id,
      flds: noteType.fields.map((f) => ({ name: f.name })),
      req: this.buildRequirements(noteType),
      tmpls: noteType.cardTemplates.map((t) => ({
        name: t.name,
        qfmt: t.frontTemplate,
        afmt: t.backTemplate,
      })),
      css: noteType.styling,
    });

    if (!model) {
      throw new Error('Failed to create Anki model.');
    }

    // Create the Deck
    const deckId = this.generateDeckId(deckName);
    const deck = this.genankiService.createDeck(deckId, deckName);

    if (!deck) {
      throw new Error('Failed to create Anki deck.');
    }

    // Create the Package
    const Package = genanki.Package;
    const pkg = new Package();

    // Get image field for handling (field with fieldType === 'image')
    const imageField = noteType.fields.find((f) => f.fieldType === 'image');

    // Process each flashcard
    for (const flashcard of flashcards) {
      const fieldValues: string[] = [];
      const imageFilenames: string[] = [];

      // Build field values in order
      for (const field of noteType.fields) {
        if (imageField && field.name === imageField.name && flashcard.selectedImages.length > 0) {
          // Handle image field - include ALL selected images
          const imgTags = flashcard.selectedImages.map((image, idx) => {
            const filename = `${flashcard.id}_${idx}_${this.sanitizeFilename(image.title)}.jpg`;
            imageFilenames.push(filename);
            return `<img src="${filename}">`;
          });
          fieldValues.push(imgTags.join(' '));
        } else {
          fieldValues.push(flashcard.fieldValues[field.name] || '');
        }
      }

      // Add note to deck
      deck.addNote(this.genankiService.createNote(model, fieldValues));

      // Add image media for all selected images (scaled to 200px height)
      for (let i = 0; i < flashcard.selectedImages.length; i++) {
        const image = flashcard.selectedImages[i];
        const filename = imageFilenames[i];

        if (filename) {
          const base64 = await this.fetchImageWithProxy(image.url);
          if (base64) {
            // Scale image to 200px height for Anki
            const scaledBase64 = await this.scaleImageTo200pxHeight(base64);
            const blob = this.base64ToBlob(scaledBase64);
            pkg.addMedia(blob, filename);
          }
        }
      }
    }

    // Add deck and export
    pkg.addDeck(deck);
    pkg.writeToFile(`${deckName}.apkg`);
  }

  /**
   * Fetch image using CORS proxy to avoid CORS errors.
   * Uses local proxy in dev, production proxy on Render in prod.
   */
  private async fetchImageWithProxy(imageUrl: string): Promise<string | null> {
    const proxyBaseUrl = isDevMode() ? 'http://localhost:3000' : 'https://llaio-api.onrender.com';
    const proxyUrl = `${proxyBaseUrl}/proxy?url=${encodeURIComponent(imageUrl)}`;

    try {
      // Try local proxy first
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        return this.blobToBase64(blob);
      }
    } catch {
      console.warn('Local proxy fetch failed for:', imageUrl);
    }

    // Fallback to direct fetch (might work for some URLs)
    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        const blob = await response.blob();
        return this.blobToBase64(blob);
      }
    } catch {
      console.warn('Direct fetch also failed for:', imageUrl);
    }

    return null;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Scale image to 200px height while maintaining aspect ratio.
   * Uses canvas for resizing.
   */
  private scaleImageTo200pxHeight(base64: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const targetHeight = 200;
        const aspectRatio = img.width / img.height;
        const targetWidth = Math.round(targetHeight * aspectRatio);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          // Fallback to original if canvas fails
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }

  private buildRequirements(noteType: NoteType): [number, 'all' | 'any', number[]][] {
    // For each template, require first required field
    const requiredFieldIndex = noteType.fields.findIndex((f) => f.required);
    const fieldIndex = requiredFieldIndex >= 0 ? requiredFieldIndex : 0;

    return noteType.cardTemplates.map((_, i) => [i, 'all', [fieldIndex]]);
  }

  private generateDeckId(deckName: string): number {
    // Generate a stable ID from deck name
    let hash = 0;
    for (let i = 0; i < deckName.length; i++) {
      const char = deckName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  }

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mime });
  }
}

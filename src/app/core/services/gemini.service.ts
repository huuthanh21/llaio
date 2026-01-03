import { inject, Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { Observable } from 'rxjs';
import { Flashcard } from '../../features/flashcard-generator/models/flashcard.types';
import { NoteType } from '../../features/flashcard-generator/models/note-type.model';
import { getFlashcardInstruction, getWordDefinitionInstruction } from '../configs/gemini.config';
import { FlashcardApiResponse } from '../models/gemini.model';
import { LanguageStore } from '../stores/language.store';
import { SettingsStore } from '../stores/settings.store';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly settingsStore = inject(SettingsStore);

  private readonly languageStore = inject(LanguageStore);

  public generateDefinition(word: string): Observable<string> {
    return new Observable<string>((observer) => {
      const apiKey = this.settingsStore.apiKey();

      if (!apiKey) {
        observer.error('Please configure your Gemini API key in Settings.');
        return;
      }

      const genAI = new GoogleGenAI({ apiKey });
      const { model, config } = getWordDefinitionInstruction(
        this.languageStore.targetLanguage(),
        this.languageStore.nativeLanguage(),
      );

      genAI.models
        .generateContentStream({
          model,
          config,
          contents: [
            {
              role: 'user',
              parts: [{ text: word }],
            },
          ],
        })
        .then(async (response) => {
          let fullText = '';
          for await (const chunk of response) {
            const chunkText = chunk.text || '';
            fullText += chunkText;
            observer.next(fullText);
          }
          observer.complete();
        })
        .catch((err: unknown) => {
          observer.error(err);
        });
    });
  }

  /**
   * Generate flashcards for a list of words using Gemini AI.
   * The AI generates values for fields marked as aiGenerated in the NoteType.
   */
  public generateFlashcards(words: string[], noteType: NoteType): Observable<Flashcard[]> {
    return new Observable<Flashcard[]>((observer) => {
      const apiKey = this.settingsStore.apiKey();

      if (!apiKey) {
        observer.error('Please configure your Gemini API key in Settings.');
        return;
      }

      const genAI = new GoogleGenAI({ apiKey });
      // Pass noteType to build dynamic schema
      const { model, config } = getFlashcardInstruction(noteType);

      genAI.models
        .generateContent({
          model,
          config,
          contents: [
            {
              role: 'user',
              parts: [{ text: words.join('; ') }],
            },
          ],
        })
        .then((response) => {
          const text = response.text || '';
          const parsed = JSON.parse(text) as FlashcardApiResponse;

          // Map response directly - field names match NoteType fields
          const flashcards: Flashcard[] = parsed.flashcards.map((item) => ({
            id: crypto.randomUUID(),
            noteTypeId: noteType.id,
            fieldValues: { ...item },
            selectedImages: [],
          }));

          observer.next(flashcards);
          observer.complete();
        })
        .catch((err: unknown) => {
          observer.error(err);
        });
    });
  }
}

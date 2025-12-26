import { inject, Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { Observable } from 'rxjs';
import { GEMINI_CONFIG } from '../configs/gemini.config';
import { SettingsStore } from '../stores/settings.store';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly settingsStore = inject(SettingsStore);

  public generateDefinition(word: string): Observable<string> {
    return new Observable<string>((observer) => {
      const apiKey = this.settingsStore.apiKey();

      if (!apiKey) {
        observer.error('Please configure your Gemini API key in Settings.');
        return;
      }

      const genAI = new GoogleGenAI({ apiKey });
      const { model, config } = GEMINI_CONFIG;

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
            // Optionally emit partial updates here if we want streaming UI later
            // observer.next(fullText);
          }
          // For now, emit the full text at the end to match current behavior
          observer.next(fullText);
          observer.complete();
        })
        .catch((err: unknown) => {
          observer.error(err);
        });
    });
  }
}

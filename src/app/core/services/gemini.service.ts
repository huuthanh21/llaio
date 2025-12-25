import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { Observable } from 'rxjs';
import { GEMINI_CONFIG } from '../configs/gemini.config';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly genAI: GoogleGenAI;

  public constructor() {
    this.genAI = new GoogleGenAI({
      apiKey: GEMINI_CONFIG.apiKey,
    });
  }

  public generateDefinition(word: string): Observable<string> {
    const { model, config } = GEMINI_CONFIG;

    return new Observable<string>((observer) => {
      this.genAI.models
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
          }
          observer.next(fullText);
          observer.complete();
        })
        .catch((err: unknown) => {
          observer.error(err);
        });
    });
  }
}

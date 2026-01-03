import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GeminiService } from '@core/services';
import { FlashcardGridComponent } from './components/flashcard-grid/flashcard-grid.component';
import { ImageSelectionFlowComponent } from './components/image-selection-flow/image-selection-flow.component';
import { WordInputComponent } from './components/word-input/word-input.component';
import { Flashcard } from './models/flashcard.types';
import { NoteType } from './models/note-type.model';
import { ENGLISH_PICTURE_WORDS } from './models/note-types/english-picture-words';

export type GeneratorStep = 'input' | 'images' | 'preview';

@Component({
  selector: 'app-flashcard-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WordInputComponent, ImageSelectionFlowComponent, FlashcardGridComponent],
  templateUrl: './flashcard-generator.component.html',
})
export class FlashcardGeneratorComponent {
  private readonly geminiService = inject(GeminiService);

  protected readonly step = signal<GeneratorStep>('input');

  protected readonly flashcards = signal<Flashcard[]>([]);

  protected readonly noteType = signal<NoteType>(ENGLISH_PICTURE_WORDS);

  protected readonly isLoading = signal(false);

  protected readonly error = signal<string | null>(null);

  protected generateFlashcards(words: string[]) {
    this.isLoading.set(true);
    this.error.set(null);

    this.geminiService.generateFlashcards(words, this.noteType()).subscribe({
      next: (cards) => {
        this.flashcards.set(cards);
        this.step.set('images');
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.error.set(message);
        this.isLoading.set(false);
      },
    });
  }

  protected previewCards(completedCards: Flashcard[]) {
    this.flashcards.set(completedCards);
    this.step.set('preview');
  }

  protected updateFlashcard(updatedCard: Flashcard) {
    const index = this.flashcards().findIndex((card) => card.id === updatedCard.id);
    if (index !== -1) {
      this.flashcards.update((cards) => {
        cards[index] = updatedCard;
        return cards;
      });
    }
  }
}

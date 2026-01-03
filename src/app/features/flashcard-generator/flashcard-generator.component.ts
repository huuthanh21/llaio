import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FlashcardGridComponent } from './components/flashcard-grid/flashcard-grid.component';
import { ImageSelectionFlowComponent } from './components/image-selection-flow/image-selection-flow.component';
import { WordInputComponent } from './components/word-input/word-input.component';
import { Flashcard } from './models/flashcard.types';
import { MockDataService } from './services/mock-data.service';

export type GeneratorStep = 'input' | 'images' | 'preview';

@Component({
  selector: 'app-flashcard-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WordInputComponent, ImageSelectionFlowComponent, FlashcardGridComponent],
  templateUrl: './flashcard-generator.component.html',
})
export class FlashcardGeneratorComponent {
  public step = signal<GeneratorStep>('input');

  public flashcards = signal<Flashcard[]>([]);

  private mockDataService = inject(MockDataService);

  public handleWordsSubmit(words: string[]) {
    // Generate initial flashcards with definitions
    const templates = this.mockDataService.generateMockFlashcards(words);

    // Convert to Flashcard objects (images will be selected next)
    const initialCards: Flashcard[] = templates.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      selectedImages: [],
      // customSearchPhrase is optional
    }));

    this.flashcards.set(initialCards);
    this.step.set('images');
  }

  public handleImagesComplete(completedCards: Flashcard[]) {
    this.flashcards.set(completedCards);
    this.step.set('preview');
  }
}

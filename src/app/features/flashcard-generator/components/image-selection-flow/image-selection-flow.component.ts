import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Flashcard, FlashcardImage } from '../../models/flashcard.types';
import { NoteType } from '../../models/note-type.model';
import { ImageSelectorComponent } from '../image-selector/image-selector.component';

@Component({
  selector: 'app-image-selection-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageSelectorComponent],
  templateUrl: './image-selection-flow.component.html',
})
export class ImageSelectionFlowComponent {
  public readonly flashcards = input<Flashcard[]>([]);

  public readonly noteType = input.required<NoteType>();

  public readonly complete = output<Flashcard[]>();

  public readonly backToInput = output();

  protected currentIndex = signal(0);

  protected currentCard = computed(() => this.flashcards()[this.currentIndex()]);

  protected selectCardImages(images: FlashcardImage[]) {
    // Update the current flashcard with selected images
    // Note: With input signals, flashcards are read-only. This mutation pattern
    // should ideally emit updates to parent.
    const cards = this.flashcards();
    if (cards[this.currentIndex()]) {
      cards[this.currentIndex()].selectedImages = images;
    }
  }

  protected moveToNextCard() {
    if (this.currentIndex() < this.flashcards().length - 1) {
      this.currentIndex.update((i) => i + 1);
    } else {
      this.complete.emit(this.flashcards());
    }
  }

  protected moveToPreviousCard() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    } else {
      this.backToInput.emit();
    }
  }
}

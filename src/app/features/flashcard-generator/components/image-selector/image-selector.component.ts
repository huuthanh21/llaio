import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Check, LucideAngularModule, Search } from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import {
  CardComponent,
  CardContentDirective,
  CardDescriptionDirective,
  CardHeaderDirective,
  CardTitleDirective,
} from '../../../../shared/components/card/card.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { InputDirective } from '../../../../shared/directives/input/input.directive';
import { Flashcard, FlashcardImage } from '../../models/flashcard.types';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-image-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    CardComponent,
    CardHeaderDirective,
    CardTitleDirective,
    CardDescriptionDirective,
    CardContentDirective,
    InputDirective,
    BadgeComponent,
    LucideAngularModule,
  ],
  templateUrl: './image-selector.component.html',
})
export class ImageSelectorComponent {
  // Services
  private readonly mockDataService = inject(MockDataService);

  // Constants
  protected readonly ICONS = {
    Search,
    Check,
  };

  // Inputs
  public readonly flashcard = input.required<Flashcard>();

  public readonly currentIndex = input(0);

  public readonly totalCards = input(0);

  // Outputs
  public readonly imagesSelected = output<FlashcardImage[]>();

  public readonly next = output();

  public readonly back = output();

  // Public State
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly images = signal<FlashcardImage[]>([]);

  protected readonly selectedImages = signal<FlashcardImage[]>([]);

  private imageOffset = 0;

  // Constructor
  public constructor() {
    effect(() => {
      const card = this.flashcard();
      if (card) {
        this.initializeCard();
      }
    });
  }

  private initializeCard() {
    const card = this.flashcard();
    this.searchControl.setValue(card.customSearchPhrase || card.word);
    this.images.set(this.mockDataService.generateMockImages(card.word));
    this.selectedImages.set(card.selectedImages || []);
    this.imageOffset = 0;
  }

  protected search() {
    const term = this.searchControl.value;
    const newImages = this.mockDataService.generateMockImages(term, this.imageOffset);
    this.images.set(newImages);
  }

  protected loadMore() {
    const newOffset = this.imageOffset + 6;
    this.imageOffset = newOffset;
    const term = this.searchControl.value;
    const moreImages = this.mockDataService.generateMockImages(term, newOffset);
    this.images.update((current) => [...current, ...moreImages]);
  }

  protected toggleImageSelection(image: FlashcardImage) {
    const isSelected = this.selectedImages().some((img) => img.id === image.id);

    if (isSelected) {
      this.selectedImages.update((current) => current.filter((img) => img.id !== image.id));
    } else {
      if (this.selectedImages().length < 2) {
        this.selectedImages.update((current) => [...current, image]);
      }
    }
  }

  protected isImageSelected(imageId: string): boolean {
    return this.selectedImages().some((img) => img.id === imageId);
  }

  protected navigateNext() {
    this.imagesSelected.emit(this.selectedImages());
    this.next.emit();
  }
}

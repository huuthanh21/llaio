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
import {
  BadgeComponent,
  CardComponent,
  CardContentDirective,
  CardDescriptionDirective,
  CardHeaderDirective,
  CardTitleDirective,
} from '@shared/components';
import { ButtonDirective, InputDirective } from '@shared/directives';
import { Check, LucideAngularModule, Search } from 'lucide-angular';
import { Flashcard, FlashcardImage } from '../../models/flashcard.types';
import { NoteType, NoteTypeField } from '../../models/note-type.model';
import { IMAGES_PER_PAGE, ImageSearchService } from '../../services/image-search.service';

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
  private readonly imageSearchService = inject(ImageSearchService);

  // Constants
  protected readonly ICONS = {
    Search,
    Check,
  };

  // Inputs
  public readonly flashcard = input.required<Flashcard>();

  public readonly noteType = input.required<NoteType>();

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

  protected readonly isLoading = signal(false);

  private imageOffset = 1;

  // Constructor
  public constructor() {
    effect(() => {
      const card = this.flashcard();
      if (card) {
        this.initializeCard();
      }
    });
  }

  protected getFlashcardTitle(): string {
    const titleField = this.noteType().fields.find((f) => f.isTitle);
    return titleField ? this.flashcard().fieldValues[titleField.name] || 'Word' : 'Word';
  }

  private async initializeCard() {
    const card: Flashcard = this.flashcard();
    const titleField: NoteTypeField | undefined = this.noteType().fields.find((f) => f.isTitle);
    const word: string | undefined = titleField ? card.fieldValues[titleField.name] : undefined;

    if (!word) {
      console.error('No word can be used to search for images');
      return;
    }

    this.searchControl.setValue(word);
    this.selectedImages.set(card.selectedImages || []);
    this.imageOffset = 1;

    this.isLoading.set(true);
    const searchImages = await this.imageSearchService.searchImages(word, 1);
    this.images.set(searchImages);
    this.isLoading.set(false);
  }

  protected async search() {
    const term = this.searchControl.value;
    this.imageOffset = 1;
    this.isLoading.set(true);
    const searchImages = await this.imageSearchService.searchImages(term, 1);
    this.images.set(searchImages);
    this.isLoading.set(false);
  }

  protected async loadMore() {
    this.imageOffset += IMAGES_PER_PAGE;
    const term = this.searchControl.value;
    this.isLoading.set(true);
    const moreImages = await this.imageSearchService.searchImages(term, this.imageOffset);
    this.images.update((current) => [...current, ...moreImages]);
    this.isLoading.set(false);
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

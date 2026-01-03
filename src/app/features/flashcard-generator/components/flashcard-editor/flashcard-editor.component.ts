import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  CardComponent,
  CardContentDirective,
  CardDescriptionDirective,
  CardFooterDirective,
  CardHeaderDirective,
  CardTitleDirective,
} from '@shared/components';
import { ButtonDirective, InputDirective, TextareaDirective } from '@shared/directives';
import { LucideAngularModule, X } from 'lucide-angular';
import { Flashcard, FlashcardImage } from '../../models/flashcard.types';

@Component({
  selector: 'app-flashcard-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    CardComponent,
    CardHeaderDirective,
    CardTitleDirective,
    CardDescriptionDirective,
    CardContentDirective,
    CardFooterDirective,
    InputDirective,
    TextareaDirective,
    LucideAngularModule,
  ],
  templateUrl: './flashcard-editor.component.html',
})
export class FlashcardEditorComponent {
  // Constants
  protected readonly ICONS = {
    X,
  };

  // Inputs
  public readonly flashcard = input<Flashcard | null>(null);

  // Outputs
  public readonly save = output<Flashcard>();

  public readonly cancelEdit = output();

  // Public State
  protected readonly form = new FormGroup({
    word: new FormControl('', { nonNullable: true }),
    definition: new FormControl('', { nonNullable: true }),
    example: new FormControl('', { nonNullable: true }),
  });

  protected readonly editedImages = signal<FlashcardImage[]>([]);

  // Constructor
  public constructor() {
    effect(() => {
      const card = this.flashcard();
      if (card) {
        this.initializeForm();
      }
    });
  }

  private initializeForm() {
    const card = this.flashcard();
    if (!card) return;

    this.form.patchValue({
      word: card.word,
      definition: card.definition,
      example: card.example,
    });

    this.editedImages.set([...card.selectedImages]);
  }

  protected removeImage(imageId: string) {
    this.editedImages.update((current) => current.filter((img) => img.id !== imageId));
  }

  public onCancel() {
    this.cancelEdit.emit();
  }

  public onSave() {
    const card = this.flashcard();
    if (!card || this.form.invalid) return;

    const updatedFlashcard: Flashcard = {
      ...card,
      word: this.form.controls.word.value,
      definition: this.form.controls.definition.value,
      example: this.form.controls.example.value,
      selectedImages: this.editedImages(),
    };

    this.save.emit(updatedFlashcard);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
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
import { NoteType } from '../../models/note-type.model';

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

  public readonly noteType = input.required<NoteType>();

  // Outputs
  public readonly save = output<Flashcard>();

  public readonly cancelEdit = output();

  // Public State - dynamic form group
  protected readonly form = signal<FormGroup>(new FormGroup({}));

  protected readonly editedImages = signal<FlashcardImage[]>([]);

  protected readonly formReady = signal(false);

  protected readonly editableFields = computed(() => {
    if (!this.formReady()) {
      return [];
    }
    return this.noteType().fields.filter((f) => f.fieldType !== 'image');
  });

  // Constructor
  public constructor() {
    effect(() => {
      const card = this.flashcard();
      const noteType = this.noteType();
      if (card && noteType) {
        this.initializeForm();
      }
    });
  }

  private initializeForm() {
    const card = this.flashcard();
    const noteType = this.noteType();
    if (!card || !noteType) return;

    // Reset form ready state before rebuilding
    this.formReady.set(false);

    // Build form controls dynamically from note type fields
    const controls: Record<string, FormControl<string>> = {};
    for (const field of noteType.fields) {
      // Skip image fields - they are handled separately
      if (field.fieldType !== 'image') {
        controls[field.name] = new FormControl(card.fieldValues[field.name] || '', {
          nonNullable: true,
        });
      }
    }

    this.form.set(new FormGroup(controls));
    this.editedImages.set([...card.selectedImages]);
    this.formReady.set(true);
  }

  protected removeImage(imageId: string) {
    this.editedImages.update((current) => current.filter((img) => img.id !== imageId));
  }

  protected discardChanges() {
    this.cancelEdit.emit();
  }

  protected saveChanges() {
    const card = this.flashcard();
    const formGroup = this.form();
    if (!card || formGroup.invalid) return;

    // Build fieldValues from form controls
    const fieldValues: Record<string, string> = {};
    for (const fieldName of Object.keys(formGroup.controls)) {
      fieldValues[fieldName] = (formGroup.get(fieldName) as FormControl<string>).value;
    }

    const updatedFlashcard: Flashcard = {
      ...card,
      fieldValues,
      selectedImages: this.editedImages(),
    };

    this.save.emit(updatedFlashcard);
  }
}

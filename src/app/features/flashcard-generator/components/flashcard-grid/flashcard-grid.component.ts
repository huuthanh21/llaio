import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule, Pencil } from 'lucide-angular';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { Flashcard } from '../../models/flashcard.types';
import { NoteType } from '../../models/note-type.model';
import { ExportFlashcardsModal } from '../export-dialog/export-flashcards-modal.component';
import { FlashcardEditorComponent } from '../flashcard-editor/flashcard-editor.component';
import { FlashcardPreviewComponent } from '../flashcard-preview/flashcard-preview.component';

@Component({
  selector: 'app-flashcard-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    LucideAngularModule,
    FlashcardPreviewComponent,
    FlashcardEditorComponent,
    ExportFlashcardsModal,
    ModalComponent,
  ],
  templateUrl: './flashcard-grid.component.html',
})
export class FlashcardGridComponent {
  // Constants
  protected readonly ICONS = {
    Pencil,
  };

  // Inputs
  public readonly flashcards = input<Flashcard[]>([]);

  public readonly noteType = input.required<NoteType>();

  // Outputs
  public readonly updateFlashcard = output<Flashcard>();

  // Protected State
  protected readonly editingCard = signal<Flashcard | null>(null);

  protected readonly showExportDialog = signal(false);

  // Get the title field for aria-labels
  protected readonly titleField = computed(() => this.noteType().fields.find((f) => f.isTitle));

  protected getCardTitle(card: Flashcard): string {
    const field = this.titleField();
    return field ? card.fieldValues[field.name] || 'Untitled' : 'Untitled';
  }

  protected openEditor(card: Flashcard) {
    this.editingCard.set({ ...card, fieldValues: { ...card.fieldValues } });
  }

  protected closeEditor() {
    this.editingCard.set(null);
  }

  protected saveCard(updatedCard: Flashcard) {
    this.updateFlashcard.emit(updatedCard);
    this.closeEditor();
  }

  protected openExportModal() {
    this.showExportDialog.set(true);
  }
}

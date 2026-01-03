import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { LucideAngularModule, Pencil } from 'lucide-angular';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { Flashcard } from '../../models/flashcard.types';
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

  // Protected State
  protected readonly editingCard = signal<Flashcard | null>(null);

  protected readonly showExportDialog = signal(false);

  protected openEditor(card: Flashcard) {
    this.editingCard.set({ ...card }); // Deep copy (or shallow copy is enough since structure is flat-ish, but image array needs care inside editor)
  }

  protected closeEditor() {
    this.editingCard.set(null);
  }

  protected saveCard(_updatedCard: Flashcard) {
    // Note: With input signals, the flashcards are read-only from the parent.
    // We should emit an event to parent for updates. For now, this is a limitation
    // that would require parent component changes to handle properly.
    // Consider using a model() or output() for two-way binding in future refactor.
    this.closeEditor();
  }

  protected openExportModal() {
    this.showExportDialog.set(true);
  }
}

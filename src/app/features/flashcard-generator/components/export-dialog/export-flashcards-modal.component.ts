import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Download, LucideAngularModule } from 'lucide-angular';
import {
  ModalContentDirective,
  ModalFooterDirective,
} from '../../../../shared/components/modal/modal.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { Flashcard } from '../../models/flashcard.types';
import { NoteType } from '../../models/note-type.model';
import { AnkiExportService } from '../../services/anki-export.service';

@Component({
  selector: 'app-export-flashcards-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, LucideAngularModule, ModalContentDirective, ModalFooterDirective],
  templateUrl: './export-flashcards-modal.component.html',
})
export class ExportFlashcardsModal {
  private readonly ankiExportService = inject(AnkiExportService);

  // Constants
  protected readonly ICONS = {
    Download,
  };

  // Inputs
  public readonly flashcards = input<Flashcard[]>([]);

  public readonly noteType = input.required<NoteType>();

  // Outputs
  public readonly cancelExport = output();

  // State
  protected readonly isExporting = signal(false);

  protected readonly errorMessage = signal<string | null>(null);

  protected async handleExport() {
    this.isExporting.set(true);
    this.errorMessage.set(null);

    try {
      const deckName = this.noteType().deckName || this.noteType().name;
      await this.ankiExportService.exportToApkg(this.flashcards(), this.noteType(), deckName);
      this.cancelExport.emit();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(message);
    } finally {
      this.isExporting.set(false);
    }
  }
}

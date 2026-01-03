import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Download, LucideAngularModule } from 'lucide-angular';
import {
  ModalContentDirective,
  ModalFooterDirective,
} from '../../../../shared/components/modal/modal.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { Flashcard } from '../../models/flashcard.types';

@Component({
  selector: 'app-export-flashcards-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, LucideAngularModule, ModalContentDirective, ModalFooterDirective],
  templateUrl: './export-flashcards-modal.component.html',
})
export class ExportFlashcardsModal {
  // Constants
  protected readonly ICONS = {
    Download,
  };

  // Inputs
  public readonly flashcards = input<Flashcard[]>([]);

  // Outputs
  public readonly cancelExport = output();

  public handleExport() {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(this.flashcards(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'flashcards_export.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    this.cancelExport.emit();
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  CardComponent,
  CardContentDirective,
  CardHeaderDirective,
} from '../../../../shared/components/card/card.component';
import { Flashcard } from '../../models/flashcard.types';
import { NoteType } from '../../models/note-type.model';

@Component({
  selector: 'app-flashcard-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CardContentDirective, CardHeaderDirective],
  templateUrl: './flashcard-preview.component.html',
})
export class FlashcardPreviewComponent {
  public readonly flashcard = input.required<Flashcard>();

  public readonly noteType = input.required<NoteType>();

  public readonly compact = input(false);

  // Get the title field (marked with isTitle: true)
  protected readonly titleField = computed(() => this.noteType().fields.find((f) => f.isTitle));

  // Get displayable fields (exclude title and image fields)
  protected readonly displayFields = computed(() =>
    this.noteType().fields.filter((f) => !f.isTitle && f.fieldType !== 'image'),
  );
}

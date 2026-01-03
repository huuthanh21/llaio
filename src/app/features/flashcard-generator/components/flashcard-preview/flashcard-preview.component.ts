import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  CardComponent,
  CardContentDirective,
  CardHeaderDirective,
} from '../../../../shared/components/card/card.component';
import { Flashcard } from '../../models/flashcard.types';

@Component({
  selector: 'app-flashcard-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CardContentDirective, CardHeaderDirective],
  templateUrl: './flashcard-preview.component.html',
})
export class FlashcardPreviewComponent {
  public readonly flashcard = input.required<Flashcard>();

  public readonly compact = input(false);
}

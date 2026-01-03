import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import {
  CardComponent,
  CardContentDirective,
  CardDescriptionDirective,
  CardHeaderDirective,
  CardTitleDirective,
} from '../../../../shared/components/card/card.component';
import { ButtonDirective } from '../../../../shared/directives/button/button.directive';
import { TextareaDirective } from '../../../../shared/directives/textarea/textarea.directive';

@Component({
  selector: 'app-word-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    CardComponent,
    CardHeaderDirective,
    CardTitleDirective,
    CardDescriptionDirective,
    CardContentDirective,
    TextareaDirective,
    BadgeComponent,
    LucideAngularModule,
  ],
  templateUrl: './word-input.component.html',
})
export class WordInputComponent {
  // Constants
  protected readonly ICONS = {
    X,
  };

  // Inputs
  public readonly isLoading = input(false);

  public readonly error = input<string | null>(null);

  // Outputs
  public readonly wordsSubmit = output<string[]>();

  // Public State
  protected readonly inputControl = new FormControl('', { nonNullable: true });

  protected readonly words = signal<string[]>([]);

  protected parseWords() {
    const text = this.inputControl.value;
    const parsed = text
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    this.words.set(parsed);
  }

  protected setWords(newWords: string[]) {
    this.words.set(newWords);
  }

  protected removeWord(index: number) {
    this.words.update((current) => current.filter((_, i) => i !== index));
  }

  protected submit() {
    if (this.words().length > 0) {
      this.wordsSubmit.emit(this.words());
    }
  }
}

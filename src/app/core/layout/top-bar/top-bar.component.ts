import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { DropdownComponent } from '../../../shared/components/dropdown/dropdown.component';
import { Language, LANGUAGES, LanguageStore } from '../../stores/language.store';

@Component({
  selector: 'app-top-bar',
  imports: [DropdownComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  @Output() public readonly menuToggle = new EventEmitter<void>();

  protected readonly store = inject(LanguageStore);

  protected languages: Language[] = LANGUAGES;
}

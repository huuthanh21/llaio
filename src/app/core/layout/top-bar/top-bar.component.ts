import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
  signal,
} from '@angular/core';
import { Language, LanguageStore } from '../../stores/language.store';

@Component({
  selector: 'app-top-bar',
  imports: [],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  @Output() public readonly menuToggle = new EventEmitter<void>();

  protected readonly store = inject(LanguageStore);

  protected menuOpen = signal(false);

  protected languages: Language[] = [
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Italian',
    'Chinese',
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
}

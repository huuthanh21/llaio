import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Language, LanguageStore } from '../../stores/language.store';

@Component({
  selector: 'app-top-bar',
  imports: [MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  protected readonly store = inject(LanguageStore);
  @Output() public readonly menuToggle = new EventEmitter<void>();

  protected languages: Language[] = [
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Italian',
    'Chinese',
  ];
}

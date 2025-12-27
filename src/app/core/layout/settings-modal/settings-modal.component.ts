import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { Language, LANGUAGES, LanguageStore } from '../../stores/language.store';
import { SettingsStore } from '../../stores/settings.store';
import { Theme, ThemeStore } from '../../stores/theme.store';

// SVG path data for theme icons (Lucide icons)
const THEME_OPTIONS: DropdownOption[] = [
  {
    value: 'System',
    label: 'System',
    icon: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z M8 21h8 M12 17v4',
  },
  {
    value: 'Light',
    label: 'Light',
    icon: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
  },
  {
    value: 'Dark',
    label: 'Dark',
    icon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  },
];

@Component({
  selector: 'app-settings-modal',
  imports: [ReactiveFormsModule, A11yModule, DropdownComponent],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent {
  public readonly isOpen = input.required<boolean>();

  @Output() public readonly closeModal = new EventEmitter<void>();

  private readonly settingsStore = inject(SettingsStore);

  private readonly languageStore = inject(LanguageStore);

  private readonly themeStore = inject(ThemeStore);

  protected apiKeyControl = new FormControl('', { nonNullable: true });

  protected nativeLanguageControl = new FormControl<Language>('Vietnamese', {
    nonNullable: true,
  });

  protected themeControl = new FormControl<Theme>('System', { nonNullable: true });

  protected languages: Language[] = LANGUAGES;

  protected themeOptions: DropdownOption[] = THEME_OPTIONS;

  public constructor() {
    effect(() => {
      // Initialize form with stored value when modal opens
      if (this.isOpen()) {
        this.apiKeyControl.setValue(this.settingsStore.apiKey());
        this.nativeLanguageControl.setValue(this.languageStore.nativeLanguage());
        this.themeControl.setValue(this.themeStore.theme());
      }
    });
  }

  protected onSave(): void {
    this.settingsStore.setApiKey(this.apiKeyControl.value);
    this.languageStore.setNativeLanguage(this.nativeLanguageControl.value);
    this.themeStore.setTheme(this.themeControl.value);
    this.closeModal.emit();
  }
}

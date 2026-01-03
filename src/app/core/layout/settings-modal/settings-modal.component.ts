import { ChangeDetectionStrategy, Component, inject, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Monitor, Moon, Sun, XIcon } from 'lucide-angular';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import {
  ModalContentDirective,
  ModalFooterDirective,
  ModalHeaderDirective,
} from '../../../shared/components/modal/modal.component';
import { ButtonDirective } from '../../../shared/directives/button/button.directive';
import { InputDirective } from '../../../shared/directives/input/input.directive';
import { Language, LANGUAGES, LanguageStore } from '../../stores/language.store';
import { SettingsStore } from '../../stores/settings.store';
import { Theme, ThemeStore } from '../../stores/theme.store';

// SVG path data for theme icons (Lucide icons)
const THEME_OPTIONS: DropdownOption[] = [
  {
    value: 'System',
    label: 'System',
    icon: Monitor,
  },
  {
    value: 'Light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'Dark',
    label: 'Dark',
    icon: Moon,
  },
];

@Component({
  selector: 'app-settings-modal',
  imports: [
    ReactiveFormsModule,
    DropdownComponent,
    ButtonDirective,
    InputDirective,
    LucideAngularModule,
    ModalHeaderDirective,
    ModalContentDirective,
    ModalFooterDirective,
  ],
  templateUrl: './settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent implements OnInit {
  // Services
  private readonly settingsStore = inject(SettingsStore);

  private readonly languageStore = inject(LanguageStore);

  private readonly themeStore = inject(ThemeStore);

  // Constants
  protected readonly ICONS = {
    X: XIcon,
  };

  // Outputs
  public readonly closeModal = output();

  // Protected State
  protected readonly apiKeyControl = new FormControl('', { nonNullable: true });

  protected readonly googleCseApiKeyControl = new FormControl('', { nonNullable: true });

  protected readonly nativeLanguageControl = new FormControl<Language>('Vietnamese', {
    nonNullable: true,
  });

  protected readonly themeControl = new FormControl<Theme>('System', { nonNullable: true });

  protected readonly languages: Language[] = LANGUAGES;

  protected readonly themeOptions: DropdownOption[] = THEME_OPTIONS;

  public ngOnInit(): void {
    // Initialize form with stored values when component is created (modal opens)
    this.apiKeyControl.setValue(this.settingsStore.apiKey());
    this.googleCseApiKeyControl.setValue(this.settingsStore.googleCseApiKey());
    this.nativeLanguageControl.setValue(this.languageStore.nativeLanguage());
    this.themeControl.setValue(this.themeStore.theme());
  }

  protected onSave(): void {
    this.settingsStore.setApiKey(this.apiKeyControl.value);
    this.settingsStore.setGoogleCseApiKey(this.googleCseApiKeyControl.value);
    this.languageStore.setNativeLanguage(this.nativeLanguageControl.value);
    this.themeStore.setTheme(this.themeControl.value);
    this.closeModal.emit();
  }
}

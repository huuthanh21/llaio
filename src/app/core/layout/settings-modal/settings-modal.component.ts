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
import { DropdownComponent } from '../../../shared/components/dropdown/dropdown.component';
import { Language, LANGUAGES, LanguageStore } from '../../stores/language.store';
import { SettingsStore } from '../../stores/settings.store';

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

  protected apiKeyControl = new FormControl('', { nonNullable: true });

  protected nativeLanguageControl = new FormControl<Language>('Vietnamese', {
    nonNullable: true,
  });

  protected languages = LANGUAGES;

  public constructor() {
    effect(() => {
      // Initialize form with stored value when modal opens
      if (this.isOpen()) {
        this.apiKeyControl.setValue(this.settingsStore.apiKey());
        this.nativeLanguageControl.setValue(this.languageStore.nativeLanguage());
      }
    });
  }

  protected onSave(): void {
    this.settingsStore.setApiKey(this.apiKeyControl.value);
    this.languageStore.setNativeLanguage(this.nativeLanguageControl.value);
    this.closeModal.emit();
  }
}

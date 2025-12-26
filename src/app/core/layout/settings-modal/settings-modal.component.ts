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
import { SettingsStore } from '../../stores/settings.store';

@Component({
  selector: 'app-settings-modal',
  imports: [ReactiveFormsModule, A11yModule],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent {
  public readonly isOpen = input.required<boolean>();

  @Output() public readonly closeModal = new EventEmitter<void>();

  private readonly settingsStore = inject(SettingsStore);

  protected apiKeyControl = new FormControl('', { nonNullable: true });

  public constructor() {
    effect(() => {
      // Initialize form with stored value when modal opens
      if (this.isOpen()) {
        this.apiKeyControl.setValue(this.settingsStore.apiKey());
      }
    });
  }

  protected onSave(): void {
    this.settingsStore.setApiKey(this.apiKeyControl.value);
    this.closeModal.emit();
  }
}

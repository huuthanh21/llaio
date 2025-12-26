import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  imports: [],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DropdownComponent,
      multi: true,
    },
  ],
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() public options: string[] = [];

  @Input()
  public set value(val: string) {
    this.selectedValue.set(val);
  }

  @Input() public variant: 'default' | 'full' = 'default';

  @Input() public align: 'left' | 'right' = 'left';

  @Output() public readonly valueChange = new EventEmitter<string>();

  protected isOpen = signal(false);

  protected selectedValue = signal<string>('');

  protected disabled = signal(false);

  private onChange: (value: string) => void = () => {
    // Empty
  };

  private onTouched: () => void = () => {
    // Empty
  };

  public writeValue(value: string): void {
    this.selectedValue.set(value);
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  protected selectOption(option: string): void {
    this.selectedValue.set(option);
    this.onChange(option);
    this.valueChange.emit(option);
    this.isOpen.set(false);
    this.onTouched();
  }

  protected closeDropdown(): void {
    this.isOpen.set(false);
    this.onTouched();
  }
}

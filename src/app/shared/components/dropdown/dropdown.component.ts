import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string; // SVG path data (d attribute value)
}

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
  private readonly rawOptions = signal<string[] | DropdownOption[]>([]);

  @Input()
  public set options(val: string[] | DropdownOption[]) {
    this.rawOptions.set(val);
  }

  protected readonly normalizedOptions = computed<DropdownOption[]>(() => {
    const options = this.rawOptions();
    if (options.length === 0) return [];
    if (typeof options[0] === 'string') {
      return (options as string[]).map((option) => ({ value: option, label: option }));
    }
    return options as DropdownOption[];
  });

  protected readonly selectedOption = computed<DropdownOption | undefined>(() => {
    const value = this.selectedValue();
    return this.normalizedOptions().find((option) => option.value === value);
  });

  @Input()
  public set value(val: string) {
    this.selectedValue.set(val);
  }

  @Input() public variant: 'default' | 'full' = 'default';

  @Input() public align: 'left' | 'right' = 'left';

  @ViewChild('triggerBtn') private readonly triggerRef?: ElementRef<HTMLButtonElement>;

  protected menuMaxHeight = signal<string | null>(null);

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
    const wasOpen = this.isOpen();
    this.isOpen.set(!wasOpen);

    if (!wasOpen) {
      // Opening: calculate available space below trigger
      this.calculateMenuMaxHeight();
    } else {
      this.onTouched();
    }
  }

  private calculateMenuMaxHeight(): void {
    const triggerEl = this.triggerRef?.nativeElement;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // 20px breathing room, minimum 100px
    const maxHeight = Math.max(spaceBelow - 20, 100);
    this.menuMaxHeight.set(`${maxHeight}px`);
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

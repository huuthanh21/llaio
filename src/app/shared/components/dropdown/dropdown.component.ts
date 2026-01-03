import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChevronDown, LucideAngularModule, LucideIconData } from 'lucide-angular';
import { ButtonDirective } from '../../directives/button/button.directive';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: LucideIconData;
}

@Component({
  selector: 'lib-dropdown',
  imports: [ButtonDirective, LucideAngularModule],
  templateUrl: './dropdown.component.html',
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
  // Constants
  protected readonly ICONS = {
    ChevronDown,
  };

  // Inputs
  public readonly options = input<string[] | DropdownOption[]>([]);

  public readonly value = input<string>('');

  public readonly variant = input<'default' | 'full'>('default');

  public readonly align = input<'left' | 'right'>('left');

  // Outputs
  public readonly valueChange = output<string>();

  // View Queries
  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');

  // Protected State
  protected readonly isOpen = signal(false);

  protected readonly selectedValue = signal<string>('');

  protected readonly disabled = signal(false);

  protected readonly menuMaxHeight = signal<string | null>(null);

  // Private State
  private onChange: (value: string) => void = () => {
    // Empty
  };

  private onTouched: () => void = () => {
    // Empty
  };

  // Computed Signals
  protected readonly normalizedOptions = computed<DropdownOption[]>(() => {
    const opts = this.options();
    if (opts.length === 0) return [];
    if (typeof opts[0] === 'string') {
      return (opts as string[]).map((option) => ({ value: option, label: option }));
    }
    return opts as DropdownOption[];
  });

  protected readonly selectedOption = computed<DropdownOption | undefined>(() => {
    const value = this.selectedValue();
    return this.normalizedOptions().find((option) => option.value === value);
  });

  // Constructor
  public constructor() {
    // Sync external value input to internal selectedValue signal
    effect(() => {
      const val = this.value();
      if (val) {
        this.selectedValue.set(val);
      }
    });
  }

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
    const triggerEl = this.triggerRef()?.nativeElement;
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

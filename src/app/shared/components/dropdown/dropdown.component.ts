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

  private readonly menuRef = viewChild<ElementRef<HTMLDivElement>>('menu');

  // Protected State
  protected readonly isOpen = signal(false);

  protected readonly selectedValue = signal<string>('');

  protected readonly disabled = signal(false);

  protected readonly menuStyles = signal<Record<string, string>>({});

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

    // Close on scroll to prevent detachment but allow internal scrolling
    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }

      const handleScroll = (event: Event) => {
        const menuEl = this.menuRef()?.nativeElement;
        if (menuEl && event.target instanceof Node && menuEl.contains(event.target)) {
          return;
        }
        this.closeDropdown();
      };

      window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      onCleanup(() => {
        window.removeEventListener('scroll', handleScroll, { capture: true });
        window.removeEventListener('resize', handleScroll);
      });
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
      // Opening
      this.calculatePosition();
    } else {
      this.onTouched();
    }
  }

  private calculatePosition(): void {
    const triggerEl = this.triggerRef()?.nativeElement;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Default: Open down
    const top = rect.bottom + 4;
    // Space below
    const maxHeight = Math.max(viewportHeight - top - 20, 100);

    // If not enough space below (less than 150px) and more space above, open up?
    // For now keeping simpler logic as per plan: just cap max height.

    const styles: Record<string, string> = {
      top: `${top}px`,
      'max-height': `${maxHeight}px`,
    };

    if (this.variant() === 'full') {
      styles['width'] = `${rect.width}px`;
      styles['left'] = `${rect.left}px`;
    } else {
      if (this.align() === 'right') {
        styles['right'] = `${viewportWidth - rect.right}px`;
      } else {
        styles['left'] = `${rect.left}px`;
      }
      // Min width for non-full variant
      styles['min-width'] = '11.25rem'; // 45 * 0.25rem = 180px
    }

    this.menuStyles.set(styles);
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

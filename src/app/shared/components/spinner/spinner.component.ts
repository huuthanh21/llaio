import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'light' | 'contrast';

@Component({
  selector: 'lib-spinner',
  templateUrl: './spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  public readonly size = input<SpinnerSize>('md');

  public readonly variant = input<SpinnerVariant>('light');

  protected readonly sizeClass = computed(() => {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'size-4 border-2',
      md: 'size-6 border-2',
      lg: 'size-8 border-3',
    };
    return sizes[this.size()];
  });

  protected readonly variantClass = computed(() => {
    const variants: Record<SpinnerVariant, string> = {
      light: 'border-border border-l-foreground',
      contrast: 'border-border border-l-primary-foreground',
    };
    return variants[this.variant()];
  });
}

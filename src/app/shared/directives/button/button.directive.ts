import { Directive, computed, input } from '@angular/core';
import { tw } from '../../utils/tw';

export type ButtonVariant = 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'custom';
export type ButtonShape = 'square' | 'rounded';

const BASE_CLASSES = tw`inline-flex cursor-pointer items-center gap-2 font-medium no-underline outline-offset-2 transition-colors duration-150 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground`;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: tw`bg-primary text-primary-foreground hover:bg-primary-hover`,
  secondary: tw`bg-secondary text-secondary-foreground ring ring-border hover:bg-accent-hover`,
  destructive: tw`bg-destructive text-destructive-foreground hover:opacity-90`,
  ghost: tw`border-transparent bg-transparent text-foreground hover:bg-muted`,
  link: tw`border-transparent bg-transparent text-primary underline-offset-4 hover:underline`,
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: tw`h-10 px-2.5 text-button-14`,
  sm: tw`h-8 px-1.5 text-button-14`,
  lg: tw`h-12 px-3.5 text-button-16`,
  icon: tw`h-10 w-10 p-0`,
  custom: '',
};

const SHAPE_CLASSES: Record<ButtonShape, string> = {
  square: tw`rounded-md`,
  rounded: tw`rounded-full`,
};

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class]': 'computedClasses()',
  },
})
export class ButtonDirective {
  public readonly variant = input<ButtonVariant>('default');

  public readonly size = input<ButtonSize>('default');

  public readonly shape = input<ButtonShape>('square');

  protected readonly computedClasses = computed(
    () =>
      `${BASE_CLASSES} ${VARIANT_CLASSES[this.variant()]} ${SIZE_CLASSES[this.size()]} ${SHAPE_CLASSES[this.shape()]}`,
  );
}

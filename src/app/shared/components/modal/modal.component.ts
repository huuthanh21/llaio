import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  input,
  output,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const MODAL_SIZE_MAP: Record<ModalSize, string> = {
  sm: '24rem', // 384px
  md: '28rem', // 448px
  lg: '32rem', // 512px
  xl: '40rem', // 640px
  full: '90vw',
};

@Directive({
  selector: 'lib-modal-header, [libModalHeader]',
  host: {
    class: 'flex items-center justify-between p-6 pb-0',
  },
})
export class ModalHeaderDirective {}

@Directive({
  selector: 'lib-modal-title, [libModalTitle]',
  host: {
    class: 'm-0 text-heading-24',
  },
})
export class ModalTitleDirective {}

@Directive({
  selector: 'lib-modal-content, [libModalContent]',
  host: {
    class: 'flex-1 overflow-y-auto p-6',
  },
})
export class ModalContentDirective {}

@Directive({
  selector: 'lib-modal-footer, [libModalFooter]',
  host: {
    class: 'flex items-center justify-end gap-2 p-6 pt-0',
  },
})
export class ModalFooterDirective {}

@Component({
  selector: 'lib-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  // Inputs
  public readonly isOpen = input.required<boolean>();

  public readonly size = input<ModalSize>('md');

  public readonly closeOnBackdrop = input(true);

  public readonly closeOnEscape = input(true);

  public readonly ariaLabelledBy = input<string>('');

  // Outputs
  public readonly closeModal = output<void>();

  // Computed
  protected readonly maxWidth = computed(() => MODAL_SIZE_MAP[this.size()]);

  // Methods
  protected handleBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.closeModal.emit();
    }
  }

  protected handleEscapeKey(): void {
    if (this.closeOnEscape()) {
      this.closeModal.emit();
    }
  }
}

import { Directive } from '@angular/core';
@Directive({
  selector: 'textarea[appTextarea]',
  host: {
    class:
      'h-15 resize-none rounded-lg bg-input px-3 py-2 ring ring-border transition-all duration-150 hover:ring-border-hover focus-visible:ring-border-active focus-visible:outline-none active:ring-border-active disabled:cursor-not-allowed disabled:opacity-50',
  },
})
export class TextareaDirective {}

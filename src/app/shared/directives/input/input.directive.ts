import { Directive } from '@angular/core';
@Directive({
  selector: 'input[appInput]',
  host: {
    class:
      'flex h-9 w-full rounded-md border bg-input px-3 py-1 text-sm ring ring-border transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:ring-border-hover focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  },
})
export class InputDirective {}

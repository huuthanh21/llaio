import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'placeholder:text-muted-foreground/70 focus-visible:ring-ring/40 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-[14px] leading-relaxed ring-offset-background transition-all duration-150 hover:border-border-hover focus-visible:border-border-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };

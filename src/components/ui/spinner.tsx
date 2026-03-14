import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'contrast';
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = 'md', variant = 'light', className, ...props }, ref) => {
    const dimension = sizeMap[size];
    const strokeColor = variant === 'light' ? 'currentColor' : 'white';

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={dimension}
        height={dimension}
        className={cn('animate-spinner-spin', className)}
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray="31.4 78.5"
          strokeLinecap="round"
        />
      </svg>
    );
  },
);

Spinner.displayName = 'Spinner';

export { Spinner };

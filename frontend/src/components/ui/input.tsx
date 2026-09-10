import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  default: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, size = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-md border border-gray-200 bg-white ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[size],
          error
            ? 'border-red-500 focus-visible:ring-red-500 ring-red-500/10'
            : 'focus-visible:ring-gray-950',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

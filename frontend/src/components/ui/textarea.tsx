import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  default: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, size = 'default', rows = 3, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full rounded-md border border-gray-200 bg-white ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          sizeClasses[size],
          error
            ? 'border-red-500 focus-visible:ring-red-500 ring-red-500/10'
            : 'focus-visible:ring-gray-950',
          className
        )}
        ref={ref}
        rows={rows}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

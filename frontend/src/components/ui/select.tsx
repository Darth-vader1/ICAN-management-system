import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-2 text-sm',
  default: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, size = 'default', children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex w-full rounded-md border border-gray-200 bg-white ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right pr-8',
          sizeClasses[size],
          error
            ? 'border-red-500 focus-visible:ring-red-500 ring-red-500/10'
            : 'focus-visible:ring-gray-950',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface SelectOptionProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectOption: React.FC<SelectOptionProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);
SelectOption.displayName = 'SelectOption';

export { Select, SelectOption };

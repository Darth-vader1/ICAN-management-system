/**
 * Breadcrumbs Component
 * Navigation breadcrumbs for showing current location in app hierarchy
 * WCAG compliant with proper ARIA labels
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      {/* Home icon link */}
      <Link
        to="/dashboard"
        className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {/* Separator */}
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />

            {/* Breadcrumb item */}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate',
                  isLast
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                )}
                {...(isLast && { 'aria-current': 'page' })}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

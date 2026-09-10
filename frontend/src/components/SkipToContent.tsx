/**
 * Skip to Content Link
 * Accessibility feature for keyboard users to skip navigation
 * Appears on Tab focus, hidden otherwise
 */

import React from 'react';

interface SkipToContentProps {
  targetId?: string;
}

export function SkipToContent({ targetId = 'main-content' }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
    >
      Skip to main content
    </a>
  );
}

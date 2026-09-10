/**
 * Custom test utilities
 * Provides wrappers with providers for testing components
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock user data for tests
 */
export const mockStudent = {
  id: '1',
  email: 'student@ican.edu',
  role: 'student' as const,
  is_active: true,
};

export const mockStaff = {
  id: '2',
  email: 'staff@ican.edu',
  role: 'student_officer' as const,
  is_active: true,
  is_staff: true,
};

export const mockAdmin = {
  id: '3',
  email: 'admin@ican.edu',
  role: 'super_admin' as const,
  is_active: true,
  is_staff: true,
};

export const mockFinance = {
  id: '4',
  email: 'finance@ican.edu',
  role: 'finance_officer' as const,
  is_active: true,
  is_staff: true,
};

/**
 * Mock auth tokens
 */
export const mockTokens = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
};

/**
 * Helper to mock localStorage
 */
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Helper to wait for async updates
 */
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

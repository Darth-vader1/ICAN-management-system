/**
 * MSW Browser Setup (Development)
 * Used in development mode when VITE_ENABLE_MSW=true
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup worker with handlers
export const worker = setupWorker(...handlers);

// Start the worker
export async function startMockServiceWorker() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    try {
      await worker.start({
        onUnhandledRequest: 'warn',
      });
      console.log('🔶 MSW (Mock Service Worker) enabled');
    } catch (error) {
      console.error('Failed to start MSW:', error);
    }
  }
}

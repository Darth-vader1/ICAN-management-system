/**
 * MSW Server Setup for Node.js (Testing)
 * Used in unit tests with Vitest/Jest
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup request interception using the given handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

# Testing Guide for ICAN Platform Frontend

## Overview

This document provides guidance on running tests, writing new tests, and understanding the test infrastructure for the ICAN Tutorial Centre Management Platform frontend.

## Testing Stack

- **Vitest**: Test framework (fast, Vite-native)
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: Simulate user interactions
- **@testing-library/jest-dom**: Custom matchers
- **MSW (Mock Service Worker)**: API mocking
- **jsdom**: Browser environment simulation

## Installation

All testing dependencies are in `package.json`:

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- src/components/Layout.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep="RoleGuard"
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── Layout.test.tsx           # Component tests
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── LoginPage.test.tsx        # Page tests
│   ├── services/
│   │   ├── authService.ts
│   │   └── authService.test.ts       # Service tests
│   ├── contexts/
│   │   └── AuthContext.test.tsx      # Context tests
│   └── test/
│       ├── setup.ts                  # Test setup
│       ├── test-utils.tsx            # Custom render utilities
│       └── mocks/
│           ├── handlers.ts           # MSW API handlers
│           └── server.ts             # MSW server setup
├── vitest.config.ts                  # Vitest configuration
└── TESTING.md                        # This file
```

## Test Utilities

### Custom Render Function

Use the custom render function from `test-utils.tsx` that includes all providers:

```tsx
import { render, screen } from '../test/test-utils';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Users

Pre-defined mock users are available:

```tsx
import { mockStudent, mockStaff, mockAdmin } from '../test/test-utils';

// Use in tests
const user = mockStudent; // { id: '1', email: 'student@ican.edu', role: 'student' }
```

### Mock API Responses

API calls are automatically mocked using MSW. Define handlers in `test/mocks/handlers.ts`:

```ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/students/', () => {
    return HttpResponse.json({
      results: [{ id: '1', name: 'John Doe' }]
    });
  }),
];
```

## Writing Tests

### Component Test Example

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders navigation bar', () => {
    render(<Layout />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays user email when authenticated', () => {
    render(<Layout />);
    // Assuming AuthContext provides mockStudent
    expect(screen.getByText('student@ican.edu')).toBeInTheDocument();
  });
});
```

### User Interaction Test Example

```tsx
import { render, screen } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('submits login form', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@ican.edu');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert outcome
    expect(await screen.findByText('Welcome')).toBeInTheDocument();
  });
});
```

### Service Test Example

```tsx
import { describe, it, expect, vi } from 'vitest';
import { authService } from './authService';

describe('authService', () => {
  it('logs in user successfully', async () => {
    const response = await authService.login('student@ican.edu', 'testpass123');
    
    expect(response.user.email).toBe('student@ican.edu');
    expect(response.access).toBe('mock-access-token');
  });

  it('throws error on invalid credentials', async () => {
    await expect(
      authService.login('wrong@ican.edu', 'wrongpass')
    ).rejects.toThrow();
  });
});
```

### Context Test Example

```tsx
import { render, screen } from '../test/test-utils';
import { useAuth } from '../contexts/AuthContext';

const TestComponent = () => {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      {isAuthenticated ? `Hello ${user?.email}` : 'Not logged in'}
    </div>
  );
};

describe('AuthContext', () => {
  it('provides authentication state', () => {
    render(<TestComponent />);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});
```

### Async Test Example

```tsx
import { render, screen, waitFor } from '../test/test-utils';

describe('StudentList', () => {
  it('loads and displays students', async () => {
    render(<StudentList />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### Testing Role-Based Access

```tsx
import { render, screen } from '../test/test-utils';
import { RoleGuard } from './RoleGuard';

describe('RoleGuard', () => {
  it('shows content for allowed roles', () => {
    render(
      <RoleGuard allowedRoles={['student']}>
        <div>Student Content</div>
      </RoleGuard>
    );
    
    expect(screen.getByText('Student Content')).toBeInTheDocument();
  });

  it('hides content for disallowed roles', () => {
    render(
      <RoleGuard allowedRoles={['staff']}>
        <div>Staff Content</div>
      </RoleGuard>
    );
    
    expect(screen.queryByText('Staff Content')).not.toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Query Priority

Use queries in this order:

✅ **Preferred**:
- `getByRole` - Most accessible
- `getByLabelText` - For form fields
- `getByPlaceholderText` - If no label
- `getByText` - For non-interactive elements

❌ **Avoid**:
- `getByTestId` - Use only as last resort

```tsx
// Good
const button = screen.getByRole('button', { name: /submit/i });
const input = screen.getByLabelText('Email');

// Bad
const button = screen.getByTestId('submit-button');
```

### 2. Async Testing

Always use `waitFor` or `findBy` for async operations:

```tsx
// Good
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Or
expect(await screen.findByText('Loaded')).toBeInTheDocument();

// Bad - can cause flaky tests
expect(screen.getByText('Loaded')).toBeInTheDocument();
```

### 3. User-Centric Tests

Test from the user's perspective:

```tsx
// Good - tests what user sees
expect(screen.getByText('Welcome, John')).toBeInTheDocument();

// Bad - tests implementation details
expect(component.state.user.name).toBe('John');
```

### 4. Accessibility

Ensure tests check for accessibility:

```tsx
it('has accessible form fields', () => {
  render(<LoginForm />);
  
  expect(screen.getByLabelText('Email')).toBeRequired();
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
});
```

### 5. Test Organization

Use describe blocks to group related tests:

```tsx
describe('LoginPage', () => {
  describe('Form Validation', () => {
    it('shows error for invalid email', () => {});
    it('shows error for short password', () => {});
  });

  describe('Form Submission', () => {
    it('submits with valid data', () => {});
    it('handles network errors', () => {});
  });
});
```

### 6. Cleanup

Cleanup is automatic, but for manual cleanup:

```tsx
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

## Mocking

### Mock API Calls

Override default MSW handlers for specific tests:

```tsx
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles API error', async () => {
  server.use(
    http.get('/api/students/', () => {
      return HttpResponse.json(
        { detail: 'Server error' },
        { status: 500 }
      );
    })
  );

  render(<StudentList />);
  expect(await screen.findByText('Error loading students')).toBeInTheDocument();
});
```

### Mock Router Navigation

```tsx
import { vi } from 'vitest';
import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

it('navigates on success', async () => {
  const mockNavigate = vi.fn();
  (useNavigate as any).mockReturnValue(mockNavigate);

  render(<LoginPage />);
  // ... perform login
  
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
});
```

### Mock localStorage

```tsx
import { mockLocalStorage } from '../test/test-utils';

beforeEach(() => {
  global.localStorage = mockLocalStorage() as any;
});
```

## Coverage Goals

- **Overall**: > 70%
- **Components**: > 75%
- **Services**: > 80%
- **Utilities**: > 85%

## Troubleshooting

### Tests timing out

Increase timeout for slow tests:

```tsx
it('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Element not found

Check if element is rendered conditionally or asynchronously:

```tsx
// Use findBy for async
const element = await screen.findByText('Loaded');

// Or queryBy if element might not exist
expect(screen.queryByText('Optional')).not.toBeInTheDocument();
```

### Act warnings

Wrap state updates in act():

```tsx
import { act } from '@testing-library/react';

await act(async () => {
  // Code that updates state
});
```

### MSW not intercepting requests

Ensure server is started in setup file and handlers match request URLs exactly.

## CI/CD Integration

Tests run automatically on push:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: September 9, 2026  
**Maintained By**: Development Team

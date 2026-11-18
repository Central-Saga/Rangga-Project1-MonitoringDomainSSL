import { setupServer } from 'msw/node/server';
import { handlers } from './handlers';

const server = setupServer(...handlers);

// Setup only in test environment
if (process.env.NODE_ENV === 'test') {
  server.listen({
    onUnhandledRequest: 'error',
  });
}

// Export helpers for tests
export { handlers };
export { server };
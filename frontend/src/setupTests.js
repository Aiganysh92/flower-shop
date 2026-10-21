import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Adds helpers like expect(...).toBeInTheDocument() to the tests.
import '@testing-library/jest-dom/vitest';

// Remove the rendered page after each test so tests do not affect each other.
afterEach(() => {
  cleanup();
});

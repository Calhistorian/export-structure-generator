/**
 * Test Setup
 *
 * This file runs before each test and sets up the testing environment.
 */

import { afterAll, afterEach, beforeAll } from "vitest";

// We'll handle server setup manually to avoid import errors
// Initialize MSW handlers in the individual test files as needed

// Apply any global test configurations or mocks here
global.structuredClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Set up environment variables for testing
process.env.NODE_ENV = "test";

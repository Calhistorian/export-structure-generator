/**
 * MSW Mock Server
 *
 * Sets up a Mock Service Worker server for API mocking in tests
 */

import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// Create the MSW server with the default handlers
export const server = setupServer(...handlers);

// Helper function to create a delayed response
export function createDelayedResponse(data: any, status = 200, delayMs = 100) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Helper to simulate network errors
export function createNetworkError() {
  return Response.error();
}

// Helper to simulate server errors
export function createServerError(status = 500) {
  return HttpResponse.json({ error: "Internal Server Error" }, { status });
}

// Add more API mocking utilities as needed

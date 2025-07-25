/**
 * User Service Tests
 *
 * Tests for the user API service functions
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { getUsers, getUser, createUser, User } from "./userService";

// Sample test data
const testUsers: User[] = [
  { id: 1, name: "Test User 1", email: "test1@example.com" },
  { id: 2, name: "Test User 2", email: "test2@example.com" },
];

// Create test-specific MSW server and handlers
const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json(testUsers);
  }),

  http.get("/api/users/1", () => {
    return HttpResponse.json(testUsers[0]);
  }),

  http.get("/api/users/999", () => {
    return new Response(null, { status: 404 });
  }),

  http.post("/api/users", async ({ request }) => {
    const data = (await request.json()) as { name?: string; email?: string };

    if (!data.name || !data.email) {
      return HttpResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: 3,
      name: data.name,
      email: data.email,
    };

    return HttpResponse.json(newUser, { status: 201 });
  }),
];

const server = setupServer(...handlers);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("User API Service", () => {
  it("should fetch all users", async () => {
    const users = await getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("Test User 1");
    expect(users[1].email).toBe("test2@example.com");
  });

  it("should fetch a single user by ID", async () => {
    const user = await getUser(1);

    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.name).toBe("Test User 1");
  });

  it("should throw an error when user is not found", async () => {
    await expect(getUser(999)).rejects.toThrow("Failed to fetch user 999");
  });

  it("should create a new user", async () => {
    const newUser = await createUser({
      name: "New User",
      email: "new@example.com",
    });

    expect(newUser).toBeDefined();
    expect(newUser.id).toBe(3);
    expect(newUser.name).toBe("New User");
    expect(newUser.email).toBe("new@example.com");
  });

  it("should throw an error when creating user with invalid data", async () => {
    // @ts-ignore - Testing invalid input
    await expect(createUser({ name: "Invalid User" })).rejects.toThrow(
      "Failed to create user"
    );
  });
});

/**
 * MSW API Handlers
 *
 * Contains mock handlers for API requests during testing
 */

import { http, HttpResponse } from "msw";

// Sample user type
interface User {
  id: number;
  name: string;
  email: string;
}

// Sample data for mocking
const users: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

// Handler to get all users
const getUsersHandler = http.get("*/api/users", () => {
  return HttpResponse.json(users);
});

// Handler to get a specific user
const getUserHandler = http.get("*/api/users/:id", ({ params }) => {
  const id = Number(params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return new HttpResponse(null, { status: 404 });
  }

  return HttpResponse.json(user);
});

// Handler to create a new user
const createUserHandler = http.post("*/api/users", async ({ request }) => {
  try {
    const newUser = (await request.json()) as Partial<User>;

    if (!newUser.name || !newUser.email) {
      return new HttpResponse(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Simulate adding a new user
    const user: User = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
    };

    return HttpResponse.json(user, { status: 201 });
  } catch (error) {
    return new HttpResponse(JSON.stringify({ error: "Invalid request data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Export all handlers
export const handlers = [getUsersHandler, getUserHandler, createUserHandler];

// Add more API mock handlers as needed

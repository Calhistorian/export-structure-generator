/**
 * User API Service
 *
 * Provides functions to interact with the user API
 */

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

/**
 * Fetch all users from the API
 */
export async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users");

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch a specific user by ID
 */
export async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${id}: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create user: ${response.status} ${error.message || ""}`
    );
  }

  return response.json();
}

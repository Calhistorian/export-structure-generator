/**
 * Example TypeScript module
 *
 * This file demonstrates importing from other modules
 */

// Import using relative path
// Note: For path aliases to work, you need proper configuration
import { greet, farewell } from "./utils/greeting.js";
// When aliases are properly set up, you could use: import { greet } from '@/utils/greeting';

// TypeScript interface
interface User {
  name: string;
  age: number;
  role?: string;
}

// Create a user with TypeScript type checking
const user: User = {
  name: "Jane Doe",
  age: 28,
  role: "Developer",
};

// Function with TypeScript parameter types and return type
function formatUserInfo(user: User): string {
  return `${user.name} (${user.age}${user.role ? `, ${user.role}` : ""})`;
}

// Using the imported functions with our user
console.log("\n📝 Example using module imports:");
console.log(greet(user.name, "morning"));
console.log(`User info: ${formatUserInfo(user)}`);
console.log(farewell(user.name));

// Export for potential use in other modules
export { formatUserInfo };

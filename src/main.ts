/**
 * Application Entry Point
 *
 * Demonstrates the use of various utilities and components in the template.
 */

import { env, isProduction } from "./config/index.js";
import { logger, createServiceLogger } from "./lib/logger/index.js";
import {
  startMeasure,
  getAllPerformanceStats,
} from "./lib/telemetry/performance.js";
import { readJsonFile, writeJsonFile } from "./utils/fs.js";
import { createApiClient, ApiClientConfig } from "./utils/api.js";
import { deepClone, groupBy } from "./utils/data.js";

// Create specific loggers
const mainLogger = createServiceLogger("main");
const apiLogger = createServiceLogger("api");

// Example data interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// API response interface
interface UserApiResponse {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

// Create an API client with proper type augmentation
const apiConfig: ApiClientConfig & { logger?: any } = {
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 5000,
  logger: apiLogger,
};

const api = createApiClient(apiConfig);

/**
 * Fetch users from a sample API
 */
async function fetchUsers(): Promise<User[]> {
  try {
    // Starting performance measurement
    const endMeasure = startMeasure("fetchUsers");

    // Fetch users - Axios returns the data directly
    const users = await api.get<UserApiResponse[]>("/users");

    // Transform to our User interface
    const transformedUsers = users.map((user: UserApiResponse) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "user", // Add a role for demonstration
    }));

    // End performance measurement
    endMeasure({ userCount: transformedUsers.length });

    return transformedUsers;
  } catch (error) {
    mainLogger.error("Failed to fetch users", {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return some mock data in case of error
    return [
      {
        id: 1,
        name: "Fallback User",
        email: "fallback@example.com",
        role: "user",
      },
    ];
  }
}

/**
 * Process user data with various utility functions
 */
function processUsers(users: User[]): void {
  // Measure performance
  const endMeasure = startMeasure("processUsers");

  // Use data utilities
  const usersCopy = deepClone(users);
  const usersByRole = groupBy(usersCopy, "role");

  // Log the results
  mainLogger.info("Users processed", {
    totalUsers: users.length,
    roleGroups: Object.keys(usersByRole),
  });

  // Write to a file
  try {
    writeJsonFile("./data.json", {
      users: usersCopy,
      groups: usersByRole,
      processedAt: new Date().toISOString(),
    });

    mainLogger.info("Users saved to data.json");
  } catch (error) {
    mainLogger.error("Failed to save user data", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // End performance measurement
  endMeasure({ userCount: users.length });
}

/**
 * Main application function
 */
async function main(): Promise<void> {
  // Overall performance measurement
  const endMainMeasure = startMeasure("main");

  mainLogger.info("Application starting", {
    environment: env.NODE_ENV,
    isProduction,
  });

  // Fetch and process data
  const users = await fetchUsers();
  processUsers(users);

  // Log performance information
  const stats = getAllPerformanceStats();
  mainLogger.debug("Performance stats", { stats });

  endMainMeasure();
  mainLogger.info("Application completed");

  // In a real application, we might start a server here
  // if (require.main === module) {
  //   startServer();
  // }
}

// Run the application
main().catch((error) => {
  logger.error("Unhandled exception", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});

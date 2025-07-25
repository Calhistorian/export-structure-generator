/**
 * Environment Configuration
 *
 * Manages environment variables with validation and provides strongly-typed
 * access to configuration values across the application.
 */

import { z } from "zod";
import dotenv from "dotenv";
import { createServiceLogger } from "../lib/logger/index.js";

// Load environment variables from .env file
dotenv.config();

const logger = createServiceLogger("config");

// Define schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Server configuration
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("localhost"),

  // API configuration
  API_URL: z.string().optional(),

  // Logging configuration
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),

  // Enable/disable features
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
});

// Parse environment variables
type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Environment validation failed", {
        issues: error.issues,
      });

      // Log each validation issue
      error.issues.forEach((issue) => {
        logger.error(`Invalid environment variable: ${issue.path.join(".")}`, {
          message: issue.message,
        });
      });
    } else {
      logger.error("Failed to validate environment", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    throw new Error("Environment validation failed. See logs for details.");
  }
}

// Validate and export environment configuration
export const env = validateEnv();

// Function to check if we're in a specific environment
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export default env;

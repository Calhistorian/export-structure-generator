/**
 * Logging System
 *
 * Provides a centralized logging system based on Winston.
 * Supports multiple log levels, formats, and transports.
 */

import winston from "winston";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, json, errors } = format;

// Environment variables for logging
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Custom format for development - human readable colorized output
const developmentFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, service, ...metadata }) => {
    let metadataString = "";
    if (Object.keys(metadata).length > 0) {
      // If metadata has a stack property, it's likely an error
      if (metadata.stack) {
        metadataString = `\n${metadata.stack}`;
      } else {
        metadataString = `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }

    const serviceInfo = service ? `[${service}] ` : "";
    return `${timestamp} ${level}: ${serviceInfo}${message}${metadataString}`;
  })
);

// Production format - JSON for easier parsing by log management systems
const productionFormat = combine(timestamp(), errors({ stack: true }), json());

// Default logger configuration
const defaultOptions = {
  level: LOG_LEVEL,
  format: IS_PRODUCTION ? productionFormat : developmentFormat,
  defaultMeta: { service: "app" },
  transports: [new transports.Console()],
};

// Create the default logger
export const logger = createLogger(defaultOptions);

/**
 * Create a child logger with specific metadata
 * @param metadata - Additional metadata to include with each log
 * @param options - Optional logger configuration overrides
 */
export function createChildLogger(
  metadata: Record<string, any>,
  options: Partial<winston.LoggerOptions> = {}
): winston.Logger {
  return logger.child({
    ...metadata,
    ...options.defaultMeta,
  });
}

/**
 * Create a service-specific logger
 * @param serviceName - Name of the service to create a logger for
 */
export function createServiceLogger(serviceName: string): winston.Logger {
  return createChildLogger({ service: serviceName });
}

// Log levels:
// error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6

/**
 * Log an error with stack trace
 */
export function logError(
  message: string,
  error?: Error,
  metadata?: Record<string, any>
): void {
  if (error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  } else {
    logger.error(message, metadata);
  }
}

/**
 * Set the log level at runtime
 */
export function setLogLevel(level: string): void {
  logger.level = level;
}

export default {
  logger,
  createChildLogger,
  createServiceLogger,
  logError,
  setLogLevel,
};

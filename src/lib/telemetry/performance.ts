/**
 * Performance Monitoring Utilities
 *
 * Tools for measuring and tracking application performance.
 */

import { performance, PerformanceObserver } from "perf_hooks";
import { createServiceLogger } from "../logger/index.js";

// Create a logger specific for performance monitoring
const logger = createServiceLogger("performance");

// Store measurements
const measurements: Record<string, PerformanceMeasure[]> = {};

/**
 * Performance measure with additional metadata
 */
interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

/**
 * Start measuring the performance of an operation
 * @param name - Name of the measurement
 * @returns A function to stop the measurement
 */
export function startMeasure(
  name: string
): (metadata?: Record<string, any>) => PerformanceMeasure {
  const startName = `start-${name}`;
  const endName = `end-${name}`;

  performance.mark(startName);

  return (metadata?: Record<string, any>): PerformanceMeasure => {
    performance.mark(endName);
    const measure = performance.measure(name, startName, endName);

    const result: PerformanceMeasure = {
      name,
      duration: measure.duration,
      startTime: measure.startTime,
      endTime: measure.startTime + measure.duration,
      metadata,
    };

    // Store the measurement
    if (!measurements[name]) {
      measurements[name] = [];
    }
    measurements[name].push(result);

    // Log the measurement
    logger.debug(`Performance measure: ${name}`, {
      duration: measure.duration,
      ...metadata,
    });

    return result;
  };
}

/**
 * Measure the execution time of a function
 * @param fn - Function to measure
 * @param name - Name of the measurement
 * @param metadata - Additional metadata
 * @returns The result of the function
 */
export async function measureFn<T>(
  fn: () => Promise<T> | T,
  name: string,
  metadata?: Record<string, any>
): Promise<T> {
  const end = startMeasure(name);

  try {
    const result = await fn();
    end({ ...metadata, success: true });
    return result;
  } catch (error) {
    end({
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create a decorated version of a function that automatically measures performance
 * @param fn - Function to decorate
 * @param name - Name prefix for measurements
 * @returns The decorated function
 */
export function withPerformanceTracking<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result> | Result,
  name: string
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    return measureFn(() => fn(...args), name, {
      arguments: args.map((arg) =>
        typeof arg === "object" ? "(object)" : arg
      ),
    });
  };
}

/**
 * Get performance statistics for a specific measurement
 * @param name - Name of the measurement
 */
export function getPerformanceStats(name: string): {
  count: number;
  min: number;
  max: number;
  avg: number;
  total: number;
  measures: PerformanceMeasure[];
} | null {
  const measures = measurements[name];

  if (!measures || measures.length === 0) {
    return null;
  }

  const durations = measures.map((m) => m.duration);
  const total = durations.reduce((sum, duration) => sum + duration, 0);

  return {
    count: measures.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    avg: total / measures.length,
    total,
    measures,
  };
}

/**
 * Get performance statistics for all measurements
 */
export function getAllPerformanceStats(): Record<
  string,
  ReturnType<typeof getPerformanceStats>
> {
  const result: Record<string, ReturnType<typeof getPerformanceStats>> = {};

  for (const name in measurements) {
    result[name] = getPerformanceStats(name);
  }

  return result;
}

/**
 * Clear all performance measurements
 */
export function clearPerformanceMeasurements(): void {
  for (const name in measurements) {
    delete measurements[name];
  }

  // Clear native performance entries
  performance.clearMarks();
  performance.clearMeasures();
}

export default {
  startMeasure,
  measureFn,
  withPerformanceTracking,
  getPerformanceStats,
  getAllPerformanceStats,
  clearPerformanceMeasurements,
};

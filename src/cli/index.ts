#!/usr/bin/env node
/**
 * Command Line Interface
 *
 * Provides a command-line interface for the application.
 */

import { Command } from "commander";
import { env } from "../config/index.js";
import { logger } from "../lib/logger/index.js";

// Create a new command instance
const program = new Command();

// Setup program metadata
program.name("app-cli").description("TypeScript Template CLI").version("1.0.0");

// Example command
program
  .command("info")
  .description("Display environment information")
  .action(() => {
    logger.info("Environment Information", {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
    });

    console.table({
      "Node Environment": env.NODE_ENV,
      "Server Port": env.PORT,
      Host: env.HOST,
      "Log Level": env.LOG_LEVEL,
      "Telemetry Enabled": env.ENABLE_TELEMETRY,
    });
  });

// Add a command that runs a performance test
program
  .command("perf-test")
  .description("Run a simple performance test")
  .option("-i, --iterations <number>", "Number of iterations", "1000")
  .action(async (options) => {
    const { startMeasure, getAllPerformanceStats } = await import(
      "../lib/telemetry/performance.js"
    );

    const iterations = parseInt(options.iterations, 10);
    logger.info(`Running performance test with ${iterations} iterations`);

    // Run a simple test
    const end = startMeasure("test-operation");

    // Simulate some work
    for (let i = 0; i < iterations; i++) {
      const result = Math.sqrt(i) * Math.random();
    }

    const result = end({ iterations });
    logger.info(
      `Performance test completed in ${result.duration.toFixed(2)}ms`
    );

    // Print all stats
    console.table(getAllPerformanceStats());
  });

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}

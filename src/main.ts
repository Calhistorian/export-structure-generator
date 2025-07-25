/**
 * Export Structure Validator - Main Entry Point
 * 
 * This is a demonstration of the Export Structure Validator functionality.
 * The primary interface is through the CLI (src/cli/index.ts).
 */

import { ExportValidator } from './core/validator.js';
import { ValidationOptions } from './types/index.js';
import { createServiceLogger } from './lib/logger/index.js';
import chalk from 'chalk';

const logger = createServiceLogger('main');

async function main(): Promise<void> {
  logger.info('Export Structure Validator - Demo Mode');
  
  console.log(chalk.bold('\n🔍 Export Structure Validator'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('\nThis tool analyzes data exports to:');
  console.log('  • Document their structure');
  console.log('  • Generate type-safe schemas');
  console.log('  • Detect changes over time');
  console.log('  • Track version history');
  console.log('\n' + chalk.gray('─'.repeat(50)));
  
  console.log('\n' + chalk.bold('Usage:'));
  console.log('  npx tsx src/cli/index.ts <export-path> [options]');
  console.log('\n' + chalk.bold('Examples:'));
  console.log('  # Analyze a folder');
  console.log('  npx tsx src/cli/index.ts ./my-export/');
  console.log('\n  # Analyze a ZIP file');
  console.log('  npx tsx src/cli/index.ts ./export.zip');
  console.log('\n  # Analyze with custom options');
  console.log('  npx tsx src/cli/index.ts ./export --mode loose --format html,json');
  console.log('\n  # View version history');
  console.log('  npx tsx src/cli/index.ts history');
  console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');
  
  // Demonstrate validation with mock data if available
  const mockExportPath = './__fixtures__/exports/sample-export';
  
  try {
    logger.info('Checking for sample export...');
    // This would validate the mock export if it exists
    // For now, just show the usage information
  } catch (error) {
    logger.debug('No sample export found');
  }
}

// Run the application
main().catch((error) => {
  logger.error('Application error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
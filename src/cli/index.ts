#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { ExportValidator } from '../core/validator.js';
import { VersionManager } from '../core/versionManager.js';
import { ValidationOptions } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('cli');

// Create CLI
const program = new Command();

program
  .name('export-validator')
  .description('Analyzes data exports to document structure and detect changes')
  .version('1.0.0')
  .argument('<input>', 'Path to export (folder, .zip, or .json file)')
  .option('-m, --mode <mode>', 'Schema inference mode', 'strict')
  .option('-s, --sample-size <number>', 'Number of records to sample', '1000')
  .option('--sample-strategy <strategy>', 'Sampling strategy', 'stratified')
  .option('--max-array-sample <number>', 'Maximum array items to sample', '100')
  .option('--max-depth <number>', 'Maximum schema depth', '10')
  .option('-o, --output <path>', 'Output directory', './output/validation-results')
  .option('-f, --format <formats>', 'Output formats (comma-separated)', 'markdown,json')
  .option('--snapshot <path>', 'Previous snapshot file for comparison')
  .option('--auto-version', 'Automatically version based on changes', false)
  .option('--ci', 'CI mode - fail on breaking changes', false)
  .option('--fail-on <severity>', 'CI failure threshold (breaking|minor|patch)')
  .action(async (input, options) => {
    try {
      const formats = options.format.split(',').map((f: string) => f.trim());
      
      const validationOptions: ValidationOptions = {
        mode: options.mode as 'strict' | 'loose' | 'auto',
        sampleSize: parseInt(options.sampleSize),
        sampleStrategy: options.sampleStrategy as 'first' | 'random' | 'stratified',
        maxArraySample: parseInt(options.maxArraySample),
        maxDepth: parseInt(options.maxDepth),
        output: path.resolve(options.output),
        format: formats as ('markdown' | 'json' | 'html')[],
        snapshot: options.snapshot,
        autoVersion: options.autoVersion,
        ci: options.ci,
        failOn: options.failOn as 'breaking' | 'minor' | 'patch' | undefined
      };

      const validator = new ExportValidator(validationOptions);
      await validator.validate(input);
      
    } catch (error) {
      logger.error('Validation failed', error);
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('Show version history')
  .option('-l, --limit <number>', 'Limit number of versions', '10')
  .option('-o, --output <path>', 'Output directory', './output/validation-results')
  .action(async (options) => {
    try {
      const versionManager = new VersionManager(path.resolve(options.output));
      await versionManager.initialize();
      
      const history = await versionManager.getVersionHistory(parseInt(options.limit));
      
      if (history.length === 0) {
        console.log(chalk.yellow('No version history found'));
        return;
      }

      console.log(chalk.bold('\n📋 Version History'));
      console.log(chalk.gray('─'.repeat(80)));
      
      history.forEach(version => {
        const icon = version.breaking ? '🔴' : '🟢';
        console.log(
          `${icon} ${chalk.bold(version.version)} - ${version.timestamp} ` +
          `(${version.changeType || 'initial'})`
        );
        if (version.changeSummary) {
          console.log(`   ${chalk.gray(version.changeSummary)}`);
        }
      });
      
      console.log(chalk.gray('─'.repeat(80)) + '\n');
      
    } catch (error) {
      logger.error('Failed to get history', error);
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Compare command
program
  .command('compare')
  .description('Compare two versions')
  .requiredOption('--from <version>', 'Source version')
  .requiredOption('--to <version>', 'Target version')
  .option('-o, --output <path>', 'Output directory', './output/validation-results')
  .action(async (options) => {
    try {
      const versionManager = new VersionManager(path.resolve(options.output));
      await versionManager.initialize();
      
      const comparison = await versionManager.compareVersions(options.from, options.to);
      
      console.log(chalk.bold(`\n📊 Comparing ${options.from} → ${options.to}`));
      console.log(chalk.gray('─'.repeat(50)));
      
      // TODO: Implement detailed comparison output
      console.log(chalk.green('Comparison data loaded successfully'));
      console.log('Detailed comparison report coming soon...');
      
    } catch (error) {
      logger.error('Comparison failed', error);
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
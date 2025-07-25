import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { z } from 'zod';
import ora from 'ora';
import chalk from 'chalk';
import { 
  ValidationOptions, 
  ExportSnapshot,
  ChangeReport,
  FileNode,
  ValidationMetadata
} from '../types/index.js';
import { FileProcessor } from './fileProcessor.js';
import { SchemaInferenceEngine } from '../analyzers/schemaInference.js';
import { ChangeDetector } from './changeDetection.js';
import { VersionManager } from './versionManager.js';
import { MarkdownReporter } from '../reporters/markdownReporter.js';
import { JsonReporter } from '../reporters/jsonReporter.js';
import { HtmlReporter } from '../reporters/htmlReporter.js';
import { SchemaGenerator } from '../generators/schemaGenerator.js';
import { createServiceLogger } from '../lib/logger/index.js';
import { exportRegistry } from './exportRegistry.js';

const logger = createServiceLogger('validator');

export class ExportValidator {
  private fileProcessor: FileProcessor;
  private changeDetector: ChangeDetector;
  private versionManager: VersionManager;
  private options: ValidationOptions;
  private outputDir: string;

  constructor(options: ValidationOptions) {
    this.options = options;
    this.fileProcessor = new FileProcessor();
    this.changeDetector = new ChangeDetector();
    
    // Use export-specific output directory
    const exportType = exportRegistry.getOrDefault(options.exportType || 'generic');
    this.outputDir = path.join(options.output, exportType.outputName);
    this.versionManager = new VersionManager(this.outputDir);
  }

  async validate(inputPath: string): Promise<void> {
    const spinner = ora('Processing export...').start();

    try {
      // Initialize version manager
      await this.versionManager.initialize();

      // Process input
      spinner.text = 'Analyzing file structure...';
      const structure = await this.fileProcessor.processInput(inputPath);

      // Infer schemas
      spinner.text = 'Inferring schemas...';
      const schemas = await this.inferSchemas(structure);

      // Create snapshot
      const snapshot: ExportSnapshot = {
        metadata: {} as ValidationMetadata, // Will be filled by version manager
        structure,
        schemas,
        checksum: this.calculateChecksum(structure, schemas)
      };

      // Load previous snapshot if exists
      let changeReport: ChangeReport | null = null;
      const previousSnapshot = await this.loadPreviousSnapshot();

      if (previousSnapshot) {
        spinner.text = 'Detecting changes...';
        const changes = this.changeDetector.detectChanges(snapshot, previousSnapshot);
        
        const summary = {
          breaking: changes.filter(c => c.severity === 'breaking').length,
          minor: changes.filter(c => c.severity === 'minor').length,
          patch: changes.filter(c => c.severity === 'patch').length,
          added: changes.filter(c => c.status === 'added').length,
          removed: changes.filter(c => c.status === 'removed').length,
          modified: changes.filter(c => c.status === 'modified').length
        };

        changeReport = {
          version: {} as ValidationMetadata, // Will be filled later
          changes,
          summary
        };

        // Determine version change type
        const changeType = this.changeDetector.calculateSeverity(changes);
        
        if (this.options.ci && this.options.failOn) {
          const shouldFail = this.shouldFailCI(changes);
          if (shouldFail) {
            spinner.fail(chalk.red(`CI failed: ${summary.breaking} breaking changes detected`));
            process.exit(1);
          }
        }

        // Create new version
        spinner.text = 'Creating new version...';
        const metadata = await this.versionManager.createVersion(
          changeType,
          snapshot,
          this.generateChangeSummary(summary)
        );
        
        snapshot.metadata = metadata;
        if (changeReport) {
          changeReport.version = metadata;
        }
      } else {
        // Initial version
        spinner.text = 'Creating initial version...';
        const metadata = await this.versionManager.createVersion(
          'initial',
          snapshot,
          'Initial export structure snapshot'
        );
        
        snapshot.metadata = metadata;
      }

      // Generate reports
      spinner.text = 'Generating reports...';
      await this.generateReports(snapshot, changeReport);

      // Generate schemas
      spinner.text = 'Generating schema files...';
      const schemaGenerator = new SchemaGenerator();
      const versionDir = path.join(this.outputDir, `v${snapshot.metadata.version}`);
      await schemaGenerator.generateZodSchemas(schemas, versionDir);
      
      if (this.options.format.includes('json')) {
        await schemaGenerator.generateJsonSchemas(schemas, versionDir);
      }

      spinner.succeed(chalk.green('Validation complete!'));
      
      // Print summary
      this.printSummary(snapshot.metadata, changeReport);

    } catch (error) {
      spinner.fail(chalk.red('Validation failed'));
      logger.error('Validation error', error);
      throw error;
    } finally {
      await this.fileProcessor.cleanup();
    }
  }

  private async inferSchemas(structure: FileNode): Promise<Record<string, z.ZodType>> {
    const schemas: Record<string, z.ZodType> = {};
    const engine = new SchemaInferenceEngine({
      mode: this.options.mode,
      sampleSize: this.options.sampleSize,
      sampleStrategy: this.options.sampleStrategy,
      maxArraySample: this.options.maxArraySample,
      maxDepth: this.options.maxDepth
    });

    // Get the root export directory name to exclude it
    const rootName = structure.name;

    const processNode = async (node: FileNode, basePath: string = '') => {
      if (node.type === 'file' && this.isStructuredFile(node.path)) {
        const schema = await engine.inferFromFile(node.path);
        if (schema) {
          const schemaName = this.getSchemaName(node.path, basePath, rootName);
          schemas[schemaName] = schema;
        }
      } else if (node.type === 'directory' && node.children) {
        for (const child of node.children) {
          await processNode(child, path.join(basePath, node.name));
        }
      }
    };

    await processNode(structure);
    return schemas;
  }

  private async loadPreviousSnapshot(): Promise<ExportSnapshot | null> {
    if (this.options.snapshot) {
      // Load from specified snapshot file
      try {
        const content = await fs.readFile(this.options.snapshot, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        logger.warn('Failed to load snapshot file', error);
        return null;
      }
    }

    // Load from latest version
    const latestVersion = await this.versionManager.getLatestVersion();
    if (!latestVersion) {
      return null;
    }

    try {
      const versionDir = path.join(this.outputDir, `v${latestVersion}`);
      const snapshotPath = path.join(versionDir, 'structure.snapshot.json');
      const content = await fs.readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn('Failed to load previous snapshot', error);
      return null;
    }
  }

  private async generateReports(
    snapshot: ExportSnapshot,
    changeReport: ChangeReport | null
  ): Promise<void> {
    const versionDir = path.join(this.options.output, `v${snapshot.metadata.version}`);

    if (changeReport) {
      if (this.options.format.includes('markdown')) {
        const markdownReporter = new MarkdownReporter();
        await markdownReporter.generate(versionDir, changeReport, snapshot.structure);
      }

      if (this.options.format.includes('json')) {
        const jsonReporter = new JsonReporter();
        await jsonReporter.generate(versionDir, changeReport, snapshot.structure, snapshot);
      }

      if (this.options.format.includes('html')) {
        const htmlReporter = new HtmlReporter();
        await htmlReporter.generate(versionDir, changeReport, snapshot.structure);
      }
    }
  }

  private calculateChecksum(structure: FileNode, schemas: Record<string, z.ZodType>): string {
    const content = JSON.stringify({
      structure: this.simplifyStructureForHash(structure),
      schemaKeys: Object.keys(schemas).sort()
    });

    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  private simplifyStructureForHash(node: FileNode): any {
    return {
      name: node.name,
      type: node.type,
      size: node.size,
      children: node.children?.map(c => this.simplifyStructureForHash(c))
    };
  }

  private isStructuredFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.json', '.csv', '.xml', '.yaml', '.yml'].includes(ext);
  }

  private getSchemaName(filePath: string, basePath: string, rootName: string): string {
    // Build the relative path
    const relativePath = basePath 
      ? path.join(basePath, path.basename(filePath))
      : path.basename(filePath);
    
    // Remove root directory name if it's at the start
    let cleanPath = relativePath;
    if (cleanPath.startsWith(rootName + path.sep)) {
      cleanPath = cleanPath.substring(rootName.length + 1);
    }
    
    // Remove file extension
    cleanPath = cleanPath.replace(/\.[^.]+$/, '');
    
    // Replace path separators with underscores but preserve word boundaries
    // This keeps the path structure clear with underscores
    return cleanPath.replace(/[/\\]/g, '_');
  }

  private shouldFailCI(changes: any[]): boolean {
    if (!this.options.failOn) return false;

    const severityLevels = {
      'breaking': 3,
      'minor': 2,
      'patch': 1
    };

    const failLevel = severityLevels[this.options.failOn];
    const hasFailure = changes.some(c => severityLevels[c.severity] >= failLevel);

    return hasFailure;
  }

  private generateChangeSummary(summary: any): string {
    const parts = [];
    
    if (summary.breaking > 0) {
      parts.push(`${summary.breaking} breaking`);
    }
    if (summary.added > 0) {
      parts.push(`${summary.added} added`);
    }
    if (summary.removed > 0) {
      parts.push(`${summary.removed} removed`);
    }
    if (summary.modified > 0) {
      parts.push(`${summary.modified} modified`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }

  private printSummary(metadata: ValidationMetadata, changeReport: ChangeReport | null): void {
    console.log('\n' + chalk.bold('📊 Validation Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(chalk.bold('Version:'), metadata.version);
    console.log(chalk.bold('Type:'), metadata.changeType || 'initial');
    
    if (changeReport) {
      console.log('\n' + chalk.bold('Changes:'));
      
      if (changeReport.summary.breaking > 0) {
        console.log(chalk.red(`  🔴 ${changeReport.summary.breaking} breaking changes`));
      }
      if (changeReport.summary.added > 0) {
        console.log(chalk.green(`  ✅ ${changeReport.summary.added} fields added`));
      }
      if (changeReport.summary.removed > 0) {
        console.log(chalk.red(`  ❌ ${changeReport.summary.removed} fields removed`));
      }
      if (changeReport.summary.modified > 0) {
        console.log(chalk.yellow(`  🔄 ${changeReport.summary.modified} fields modified`));
      }
    }

    console.log('\n' + chalk.bold('Output:'), this.outputDir);
    console.log(chalk.gray('─'.repeat(50)) + '\n');
  }
}
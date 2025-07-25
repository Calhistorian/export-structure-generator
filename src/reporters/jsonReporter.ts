import * as fs from 'fs/promises';
import * as path from 'path';
import { ChangeReport, FileNode, ExportSnapshot } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('jsonReporter');

export class JsonReporter {
  async generate(
    outputDir: string,
    report: ChangeReport,
    structure: FileNode,
    snapshot: ExportSnapshot
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'changes.json');
    
    const jsonReport = {
      metadata: report.version,
      summary: report.summary,
      changes: report.changes.map(change => ({
        ...change,
        // Convert Zod schemas to string representation
        previous: change.previous ? this.schemaToString(change.previous) : undefined,
        current: change.current ? this.schemaToString(change.current) : undefined
      })),
      structure: this.simplifyStructure(structure),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(outputPath, JSON.stringify(jsonReport, null, 2));
    logger.info(`JSON report saved to ${outputPath}`);
    
    return outputPath;
  }

  private schemaToString(schema: any): string {
    // Convert Zod schema to a readable string representation
    if (schema._def) {
      const typeName = schema._def.typeName?.replace('Zod', '').toLowerCase();
      
      if (typeName === 'object' && schema._def.shape) {
        const fields = Object.entries(schema._def.shape)
          .map(([key, value]: [string, any]) => `${key}: ${this.schemaToString(value)}`)
          .join(', ');
        return `{ ${fields} }`;
      }
      
      if (typeName === 'array' && schema._def.type) {
        return `${this.schemaToString(schema._def.type)}[]`;
      }
      
      if (typeName === 'union' && schema._def.options) {
        const options = schema._def.options
          .map((opt: any) => this.schemaToString(opt))
          .join(' | ');
        return options;
      }
      
      if (typeName === 'nullable' && schema._def.innerType) {
        return `${this.schemaToString(schema._def.innerType)} | null`;
      }
      
      if (typeName === 'optional' && schema._def.innerType) {
        return `${this.schemaToString(schema._def.innerType)}?`;
      }
      
      return typeName || 'unknown';
    }
    
    return typeof schema === 'object' ? JSON.stringify(schema) : String(schema);
  }

  private simplifyStructure(node: FileNode): any {
    const simplified: any = {
      name: node.name,
      path: node.path,
      type: node.type
    };
    
    if (node.size) simplified.size = node.size;
    if (node.mimeType) simplified.mimeType = node.mimeType;
    if (node.metadata) simplified.metadata = node.metadata;
    
    if (node.children) {
      simplified.children = node.children.map(child => this.simplifyStructure(child));
    }
    
    return simplified;
  }
}
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import AdmZip from 'adm-zip';
import { fileTypeFromFile } from 'file-type';
import { FileNode } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('fileProcessor');

export class FileProcessor {
  private tempDir?: string;

  async processInput(inputPath: string): Promise<FileNode> {
    const stat = await fs.stat(inputPath);
    
    if (stat.isDirectory()) {
      return this.processDirectory(inputPath);
    } else if (inputPath.endsWith('.zip')) {
      return this.processZipFile(inputPath);
    } else if (inputPath.endsWith('.json')) {
      return this.processSingleFile(inputPath);
    } else {
      throw new Error(`Unsupported input type: ${inputPath}`);
    }
  }

  private async processDirectory(dirPath: string): Promise<FileNode> {
    const name = path.basename(dirPath);
    const node: FileNode = {
      name,
      path: dirPath,
      type: 'directory',
      children: []
    };

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        node.children!.push(await this.processDirectory(fullPath));
      } else {
        node.children!.push(await this.processSingleFile(fullPath));
      }
    }

    return node;
  }

  private async processZipFile(zipPath: string): Promise<FileNode> {
    logger.info(`Processing ZIP file: ${zipPath}`);
    
    const zip = new AdmZip(zipPath);
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-'));
    this.tempDir = tempDir;
    
    zip.extractAllTo(tempDir, true);
    
    const result = await this.processDirectory(tempDir);
    result.name = path.basename(zipPath, '.zip');
    
    return result;
  }

  private async processSingleFile(filePath: string): Promise<FileNode> {
    const stat = await fs.stat(filePath);
    const fileType = await fileTypeFromFile(filePath);
    
    const node: FileNode = {
      name: path.basename(filePath),
      path: filePath,
      type: 'file',
      size: stat.size,
      mimeType: fileType?.mime,
      metadata: {
        created: stat.birthtime,
        modified: stat.mtime
      }
    };

    // Add structured file detection
    if (this.isStructuredFile(filePath)) {
      await this.addFileMetadata(node);
    }

    return node;
  }

  private isStructuredFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.json', '.csv', '.xml', '.yaml', '.yml'].includes(ext);
  }

  private async addFileMetadata(node: FileNode): Promise<void> {
    const ext = path.extname(node.path).toLowerCase();
    
    try {
      switch (ext) {
        case '.json':
          const jsonContent = await fs.readFile(node.path, 'utf-8');
          const jsonData = JSON.parse(jsonContent);
          node.metadata!.depth = this.getJsonDepth(jsonData);
          if (Array.isArray(jsonData)) {
            node.metadata!.recordCount = jsonData.length;
          }
          break;
          
        case '.csv':
          // CSV metadata will be added when we parse with papaparse
          break;
          
        case '.xml':
          // XML metadata will be added when we parse with fast-xml-parser
          break;
      }
    } catch (error) {
      logger.warn(`Failed to extract metadata from ${node.path}`, error);
    }
  }

  private getJsonDepth(obj: any): number {
    if (obj === null || typeof obj !== 'object') return 0;
    
    if (Array.isArray(obj)) {
      return obj.length > 0 ? 1 + this.getJsonDepth(obj[0]) : 1;
    }
    
    const depths = Object.values(obj).map(v => this.getJsonDepth(v));
    return depths.length > 0 ? 1 + Math.max(...depths) : 1;
  }

  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = undefined;
    }
  }
}
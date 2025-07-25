import { z } from 'zod';

export type ChangeStatus = 'unchanged' | 'added' | 'removed' | 'modified' | 'renamed';
export type ChangeSeverity = 'breaking' | 'minor' | 'patch';
export type ChangeType = 
  | 'type_changed'
  | 'nullable_added'
  | 'nullable_removed'
  | 'optional_added'
  | 'optional_removed'
  | 'constraint_changed';

export interface FieldChange {
  path: string;
  status: ChangeStatus;
  changes?: ChangeType[];
  previous?: z.ZodType;
  current?: z.ZodType;
  previousType?: string;
  currentType?: string;
  confidence?: number;
  severity: ChangeSeverity;
  suggestedMigration?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mimeType?: string;
  metadata?: {
    created?: Date;
    modified?: Date;
    recordCount?: number;
    fieldCount?: number;
    depth?: number;
  };
  schema?: z.ZodType;
  children?: FileNode[];
}

export interface ValidationMetadata {
  version: string;
  validatorVersion: string;
  timestamp: string;
  exportHash: string;
  previousVersion?: string;
  changeType?: 'major' | 'minor' | 'patch' | 'initial';
  changeSummary?: string;
  breaking: boolean;
}

export interface ValidationOptions {
  mode: 'strict' | 'loose' | 'auto';
  sampleSize: number;
  sampleStrategy: 'first' | 'random' | 'stratified';
  maxArraySample: number;
  maxDepth: number;
  output: string;
  format: ('markdown' | 'json' | 'html')[];
  snapshot?: string;
  autoVersion: boolean;
  ci: boolean;
  failOn?: ChangeSeverity;
  exportType?: string;
}

export interface SchemaInferenceOptions {
  mode: ValidationOptions['mode'];
  sampleSize: number;
  sampleStrategy: ValidationOptions['sampleStrategy'];
  maxArraySample: number;
  maxDepth: number;
}

export interface ChangeReport {
  version: ValidationMetadata;
  changes: FieldChange[];
  summary: {
    breaking: number;
    minor: number;
    patch: number;
    added: number;
    removed: number;
    modified: number;
  };
}

export interface ExportSnapshot {
  metadata: ValidationMetadata;
  structure: FileNode;
  schemas: Record<string, any>;
  checksum: string;
}
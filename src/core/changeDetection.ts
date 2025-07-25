import { z } from 'zod';
import deepDiff from 'deep-diff';
import { 
  FieldChange, 
  ChangeSeverity, 
  ChangeType,
  FileNode,
  ExportSnapshot 
} from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('changeDetection');

export class ChangeDetector {
  detectChanges(current: ExportSnapshot, previous: ExportSnapshot): FieldChange[] {
    const changes: FieldChange[] = [];
    
    // Compare file structure
    const structureChanges = this.compareFileStructure(
      current.structure, 
      previous.structure
    );
    changes.push(...structureChanges);
    
    // Compare schemas
    const schemaChanges = this.compareSchemas(
      current.schemas,
      previous.schemas
    );
    changes.push(...schemaChanges);
    
    return changes;
  }

  private compareFileStructure(
    current: FileNode, 
    previous: FileNode,
    basePath: string = ''
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    const currentPath = basePath ? `${basePath}/${current.name}` : current.name;
    
    // Check if file/directory was modified
    if (current.type !== previous.type) {
      changes.push({
        path: currentPath,
        status: 'modified',
        changes: ['type_changed'],
        severity: 'breaking',
        suggestedMigration: `File type changed from ${previous.type} to ${current.type}`
      });
      return changes;
    }
    
    if (current.type === 'file') {
      // Compare file metadata
      if (current.size !== previous.size) {
        changes.push({
          path: currentPath,
          status: 'modified',
          severity: 'patch',
          suggestedMigration: 'File size changed'
        });
      }
    } else {
      // Compare directory contents
      const currentChildren = new Map(
        (current.children || []).map(c => [c.name, c])
      );
      const previousChildren = new Map(
        (previous.children || []).map(c => [c.name, c])
      );
      
      // Check for added files
      currentChildren.forEach((child, name) => {
        if (!previousChildren.has(name)) {
          changes.push({
            path: `${currentPath}/${name}`,
            status: 'added',
            severity: 'minor',
            suggestedMigration: 'New file/directory added'
          });
        }
      });
      
      // Check for removed files
      previousChildren.forEach((child, name) => {
        if (!currentChildren.has(name)) {
          changes.push({
            path: `${currentPath}/${name}`,
            status: 'removed',
            severity: 'breaking',
            suggestedMigration: `Remove references to ${currentPath}/${name}`
          });
        }
      });
      
      // Recursively check modified files
      currentChildren.forEach((child, name) => {
        const prevChild = previousChildren.get(name);
        if (prevChild) {
          changes.push(...this.compareFileStructure(child, prevChild, currentPath));
        }
      });
    }
    
    return changes;
  }

  private compareSchemas(
    current: Record<string, any>,
    previous: Record<string, any>
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    const allPaths = new Set([
      ...Object.keys(current),
      ...Object.keys(previous)
    ]);
    
    allPaths.forEach(path => {
      const currentSchema = current[path];
      const previousSchema = previous[path];
      
      if (!previousSchema) {
        // New schema added
        changes.push({
          path,
          status: 'added',
          current: currentSchema,
          severity: 'minor',
          suggestedMigration: 'New schema added'
        });
      } else if (!currentSchema) {
        // Schema removed
        changes.push({
          path,
          status: 'removed',
          previous: previousSchema,
          severity: 'breaking',
          suggestedMigration: `Remove usage of schema: ${path}`
        });
      } else {
        // Compare schemas for changes
        const schemaChanges = this.compareZodSchemas(
          path,
          currentSchema,
          previousSchema
        );
        changes.push(...schemaChanges);
      }
    });
    
    return changes;
  }

  private compareZodSchemas(
    path: string,
    current: any,
    previous: any
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    
    // Deep comparison of schema structures
    const schemaDiff = deepDiff.diff(previous, current);
    
    if (!schemaDiff || schemaDiff.length === 0) {
      return changes;
    }
    
    schemaDiff.forEach(change => {
      const fieldPath = `${path}.${change.path?.join('.')}`;
      const changeTypes: ChangeType[] = [];
      let severity: ChangeSeverity = 'patch';
      let suggestedMigration = '';
      
      switch (change.kind) {
        case 'N': // New property
          changeTypes.push('optional_added');
          severity = 'minor';
          suggestedMigration = 'New optional field added';
          break;
          
        case 'D': // Deleted property
          changeTypes.push('optional_removed');
          severity = 'breaking';
          suggestedMigration = `Remove field access: ${fieldPath}`;
          break;
          
        case 'E': // Edited property
          changeTypes.push('type_changed');
          severity = 'breaking';
          suggestedMigration = this.generateMigrationSuggestion(
            fieldPath,
            change.lhs,
            change.rhs
          );
          break;
          
        case 'A': // Array change
          changeTypes.push('type_changed');
          severity = 'breaking';
          break;
      }
      
      changes.push({
        path: fieldPath,
        status: 'modified',
        changes: changeTypes,
        previousType: this.getTypeString(change.lhs),
        currentType: this.getTypeString(change.rhs),
        severity,
        suggestedMigration
      });
    });
    
    return changes;
  }

  private generateMigrationSuggestion(
    path: string,
    previous: any,
    current: any
  ): string {
    const prevType = this.getTypeString(previous);
    const currType = this.getTypeString(current);
    
    if (prevType.includes('null') && !currType.includes('null')) {
      return `Add null check before using ${path}`;
    }
    
    if (!prevType.includes('null') && currType.includes('null')) {
      return `${path} can now be null, add appropriate handling`;
    }
    
    if (prevType !== currType) {
      return `Type changed from ${prevType} to ${currType}, update type annotations and usage`;
    }
    
    return `Review usage of ${path} for compatibility`;
  }

  private getTypeString(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    
    if (type === 'object') {
      if (Array.isArray(value)) return 'array';
      if (value._def) {
        // Zod schema type detection
        const typeName = value._def.typeName;
        if (typeName) return typeName.replace('Zod', '').toLowerCase();
      }
      return 'object';
    }
    
    return type;
  }

  calculateSeverity(changes: FieldChange[]): 'major' | 'minor' | 'patch' {
    const hasBreaking = changes.some(c => c.severity === 'breaking');
    const hasMinor = changes.some(c => c.severity === 'minor');
    
    if (hasBreaking) return 'major';
    if (hasMinor) return 'minor';
    return 'patch';
  }
}
import * as fs from 'fs/promises';
import * as path from 'path';
import { marked } from 'marked';
import { 
  ChangeReport, 
  FileNode, 
  FieldChange,
  ValidationMetadata 
} from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('markdownReporter');

export class MarkdownReporter {
  async generate(
    outputDir: string,
    report: ChangeReport,
    structure: FileNode
  ): Promise<string> {
    const markdown = this.buildMarkdown(report, structure);
    const outputPath = path.join(outputDir, 'report.md');
    
    await fs.writeFile(outputPath, markdown);
    logger.info(`Markdown report saved to ${outputPath}`);
    
    return outputPath;
  }

  private buildMarkdown(report: ChangeReport, structure: FileNode): string {
    const lines: string[] = [];
    
    // Header
    lines.push('# Export Structure Validation Report');
    lines.push('');
    
    // Version info
    lines.push(this.buildVersionSection(report.version));
    
    // Summary
    lines.push(this.buildSummarySection(report.summary));
    
    // Breaking changes
    const breakingChanges = report.changes.filter(c => c.severity === 'breaking');
    if (breakingChanges.length > 0) {
      lines.push(this.buildBreakingChangesSection(breakingChanges));
    }
    
    // All changes
    lines.push(this.buildChangesSection(report.changes));
    
    // File structure
    lines.push(this.buildStructureSection(structure));
    
    return lines.join('\n');
  }

  private buildVersionSection(metadata: ValidationMetadata): string {
    const lines: string[] = [];
    
    lines.push(`Version: ${metadata.previousVersion || 'initial'} → ${metadata.version}${
      metadata.breaking ? ' (BREAKING CHANGES)' : ''
    }`);
    lines.push(`Date: ${metadata.timestamp}`);
    lines.push('');
    
    return lines.join('\n');
  }

  private buildSummarySection(summary: ChangeReport['summary']): string {
    const lines: string[] = [];
    
    lines.push('## Summary');
    lines.push('');
    lines.push(`- ${summary.breaking} breaking changes detected`);
    lines.push(`- ${summary.added} new fields added`);
    lines.push(`- ${summary.removed} fields removed`);
    lines.push(`- ${summary.modified} fields modified`);
    lines.push('');
    
    return lines.join('\n');
  }

  private buildBreakingChangesSection(changes: FieldChange[]): string {
    const lines: string[] = [];
    
    lines.push('## Breaking Changes');
    lines.push('');
    
    changes.forEach(change => {
      lines.push(`### 🔴 ${change.path}`);
      
      if (change.status === 'removed') {
        lines.push('- Field removed');
      } else if (change.changes?.includes('type_changed')) {
        lines.push(`- Type changed: \`${change.previousType}\` → \`${change.currentType}\``);
      } else if (change.changes?.includes('nullable_removed')) {
        lines.push('- No longer nullable');
      }
      
      if (change.suggestedMigration) {
        lines.push(`- Migration: ${change.suggestedMigration}`);
      }
      
      lines.push('');
    });
    
    return lines.join('\n');
  }

  private buildChangesSection(changes: FieldChange[]): string {
    const lines: string[] = [];
    
    lines.push('## All Changes');
    lines.push('');
    
    // Group by status
    const grouped = this.groupChangesByStatus(changes);
    
    if (grouped.added.length > 0) {
      lines.push('### Added');
      grouped.added.forEach(change => {
        lines.push(`- ✅ ${change.path}`);
      });
      lines.push('');
    }
    
    if (grouped.removed.length > 0) {
      lines.push('### Removed');
      grouped.removed.forEach(change => {
        lines.push(`- ❌ ${change.path}`);
      });
      lines.push('');
    }
    
    if (grouped.modified.length > 0) {
      lines.push('### Modified');
      grouped.modified.forEach(change => {
        const icon = change.severity === 'breaking' ? '🔴' : '🟡';
        lines.push(`- ${icon} ${change.path}`);
        
        if (change.changes) {
          change.changes.forEach(changeType => {
            lines.push(`  - ${this.formatChangeType(changeType)}`);
          });
        }
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  private buildStructureSection(structure: FileNode): string {
    const lines: string[] = [];
    
    lines.push('## File Structure');
    lines.push('');
    lines.push('```');
    lines.push(this.buildTree(structure));
    lines.push('```');
    lines.push('');
    
    return lines.join('\n');
  }

  private buildTree(node: FileNode, prefix: string = '', isLast: boolean = true): string {
    const lines: string[] = [];
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';
    
    lines.push(prefix + connector + node.name);
    
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children!.length - 1;
        lines.push(this.buildTree(child, prefix + extension, isLastChild));
      });
    }
    
    return lines.join('\n');
  }

  private groupChangesByStatus(changes: FieldChange[]): {
    added: FieldChange[];
    removed: FieldChange[];
    modified: FieldChange[];
  } {
    return {
      added: changes.filter(c => c.status === 'added'),
      removed: changes.filter(c => c.status === 'removed'),
      modified: changes.filter(c => c.status === 'modified')
    };
  }

  private formatChangeType(changeType: string): string {
    const formats: Record<string, string> = {
      type_changed: 'Type changed',
      nullable_added: 'Now nullable',
      nullable_removed: 'No longer nullable',
      optional_added: 'Now optional',
      optional_removed: 'No longer optional',
      constraint_changed: 'Constraints changed'
    };
    
    return formats[changeType] || changeType;
  }
}
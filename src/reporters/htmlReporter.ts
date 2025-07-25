import * as fs from 'fs/promises';
import * as path from 'path';
import { ChangeReport, FileNode } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('htmlReporter');

export class HtmlReporter {
  async generate(
    outputDir: string,
    report: ChangeReport,
    structure: FileNode
  ): Promise<string> {
    const html = this.buildHtml(report, structure);
    const outputPath = path.join(outputDir, 'report.html');
    
    await fs.writeFile(outputPath, html);
    logger.info(`HTML report saved to ${outputPath}`);
    
    return outputPath;
  }

  private buildHtml(report: ChangeReport, structure: FileNode): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Structure Validation Report</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        <h1>Export Structure Validation Report</h1>
        
        ${this.buildVersionInfo(report.version)}
        ${this.buildSummary(report.summary)}
        ${this.buildChanges(report.changes)}
        ${this.buildFileTree(structure)}
    </div>
    
    <script>
        ${this.getScript()}
    </script>
</body>
</html>`;
  }

  private getStyles(): string {
    return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        h1, h2, h3 {
            color: #2c3e50;
        }
        
        .version-info {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .breaking {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .summary-card h3 {
            margin: 0;
            font-size: 2em;
            color: #495057;
        }
        
        .summary-card p {
            margin: 5px 0 0 0;
            color: #6c757d;
        }
        
        .changes-section {
            margin-bottom: 30px;
        }
        
        .change-item {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #dee2e6;
        }
        
        .change-item.breaking {
            border-left-color: #e74c3c;
        }
        
        .change-item.minor {
            border-left-color: #f39c12;
        }
        
        .change-item.patch {
            border-left-color: #27ae60;
        }
        
        .change-path {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .change-details {
            font-size: 0.9em;
            color: #666;
        }
        
        .file-tree {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        .tree-node {
            margin-left: 20px;
            position: relative;
        }
        
        .tree-node::before {
            content: '';
            position: absolute;
            left: -15px;
            top: 0;
            bottom: 0;
            width: 1px;
            background: #dee2e6;
        }
        
        .tree-node-content {
            cursor: pointer;
            padding: 2px 5px;
            display: inline-block;
        }
        
        .tree-node-content:hover {
            background: #e9ecef;
            border-radius: 3px;
        }
        
        .tree-node.collapsed > .tree-children {
            display: none;
        }
        
        .tree-toggle {
            display: inline-block;
            width: 20px;
            text-align: center;
            user-select: none;
        }
        
        .search-box {
            width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            font-size: 16px;
        }
        
        .highlight {
            background: #fff3cd;
            padding: 2px;
            border-radius: 3px;
        }
    `;
  }

  private getScript(): string {
    return `
        // Tree collapse/expand functionality
        document.querySelectorAll('.tree-node-content').forEach(node => {
            node.addEventListener('click', function(e) {
                e.stopPropagation();
                const parent = this.parentElement;
                parent.classList.toggle('collapsed');
                const toggle = this.querySelector('.tree-toggle');
                if (toggle) {
                    toggle.textContent = parent.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        });
        
        // Search functionality
        const searchBox = document.getElementById('search');
        if (searchBox) {
            searchBox.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const items = document.querySelectorAll('.change-item, .tree-node');
                
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (searchTerm === '' || text.includes(searchTerm)) {
                        item.style.display = '';
                        
                        // Highlight search term
                        if (searchTerm && item.classList.contains('change-item')) {
                            const pathEl = item.querySelector('.change-path');
                            if (pathEl) {
                                pathEl.innerHTML = pathEl.textContent.replace(
                                    new RegExp(searchTerm, 'gi'),
                                    match => '<span class="highlight">' + match + '</span>'
                                );
                            }
                        }
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    `;
  }

  private buildVersionInfo(metadata: any): string {
    return `
        <div class="version-info">
            <strong>Version:</strong> ${metadata.previousVersion || 'initial'} → ${metadata.version}
            ${metadata.breaking ? '<span class="breaking">(BREAKING CHANGES)</span>' : ''}
            <br>
            <strong>Date:</strong> ${metadata.timestamp}
        </div>
    `;
  }

  private buildSummary(summary: any): string {
    return `
        <div class="summary">
            <div class="summary-card">
                <h3>${summary.breaking}</h3>
                <p>Breaking Changes</p>
            </div>
            <div class="summary-card">
                <h3>${summary.added}</h3>
                <p>Fields Added</p>
            </div>
            <div class="summary-card">
                <h3>${summary.removed}</h3>
                <p>Fields Removed</p>
            </div>
            <div class="summary-card">
                <h3>${summary.modified}</h3>
                <p>Fields Modified</p>
            </div>
        </div>
    `;
  }

  private buildChanges(changes: any[]): string {
    const breakingChanges = changes.filter(c => c.severity === 'breaking');
    const otherChanges = changes.filter(c => c.severity !== 'breaking');
    
    return `
        <div class="changes-section">
            <h2>Changes</h2>
            <input type="text" id="search" class="search-box" placeholder="Search changes...">
            
            ${breakingChanges.length > 0 ? `
                <h3>Breaking Changes</h3>
                ${breakingChanges.map(c => this.buildChangeItem(c)).join('')}
            ` : ''}
            
            ${otherChanges.length > 0 ? `
                <h3>Other Changes</h3>
                ${otherChanges.map(c => this.buildChangeItem(c)).join('')}
            ` : ''}
        </div>
    `;
  }

  private buildChangeItem(change: any): string {
    return `
        <div class="change-item ${change.severity}">
            <div class="change-path">${change.path}</div>
            <div class="change-details">
                Status: ${change.status}
                ${change.suggestedMigration ? `<br>Migration: ${change.suggestedMigration}` : ''}
            </div>
        </div>
    `;
  }

  private buildFileTree(structure: FileNode): string {
    return `
        <div class="file-tree">
            <h2>File Structure</h2>
            ${this.buildTreeNode(structure)}
        </div>
    `;
  }

  private buildTreeNode(node: FileNode): string {
    const hasChildren = node.children && node.children.length > 0;
    
    return `
        <div class="tree-node">
            <div class="tree-node-content">
                ${hasChildren ? '<span class="tree-toggle">▼</span>' : '<span class="tree-toggle"></span>'}
                ${node.name}
                ${node.type === 'file' ? ` (${this.formatSize(node.size || 0)})` : ''}
            </div>
            ${hasChildren ? `
                <div class="tree-children">
                    ${node.children!.map(child => this.buildTreeNode(child)).join('')}
                </div>
            ` : ''}
        </div>
    `;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
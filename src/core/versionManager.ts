import * as fs from 'fs/promises';
import * as path from 'path';
import * as semver from 'semver';
import * as crypto from 'crypto';
import { ValidationMetadata, ExportSnapshot } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('versionManager');

export class VersionManager {
  private outputDir: string;
  private versionsFile: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.versionsFile = path.join(outputDir, 'versions.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    try {
      await fs.access(this.versionsFile);
    } catch {
      await fs.writeFile(this.versionsFile, JSON.stringify({
        versions: [],
        latest: null
      }, null, 2));
    }
  }

  async getLatestVersion(): Promise<string | null> {
    const manifest = await this.readVersionManifest();
    return manifest.latest;
  }

  async getVersion(version: string): Promise<ValidationMetadata | null> {
    const manifest = await this.readVersionManifest();
    const versionInfo = manifest.versions.find(v => v.version === version);
    return versionInfo || null;
  }

  async createVersion(
    changeType: 'major' | 'minor' | 'patch' | 'initial',
    snapshot: ExportSnapshot,
    changeSummary?: string
  ): Promise<ValidationMetadata> {
    const manifest = await this.readVersionManifest();
    const previousVersion = manifest.latest;
    
    let newVersion: string;
    if (!previousVersion) {
      newVersion = '1.0.0';
      changeType = 'initial';
    } else {
      newVersion = semver.inc(previousVersion, changeType) || '1.0.0';
    }

    const metadata: ValidationMetadata = {
      version: newVersion,
      validatorVersion: '1.0.0', // This should come from package.json
      timestamp: new Date().toISOString(),
      exportHash: this.calculateHash(snapshot),
      previousVersion,
      changeType,
      changeSummary,
      breaking: changeType === 'major'
    };

    // Create version directory
    const versionDir = path.join(this.outputDir, `v${newVersion}`);
    await fs.mkdir(versionDir, { recursive: true });

    // Save version data
    await this.saveVersionData(versionDir, metadata, snapshot);

    // Update manifest
    manifest.versions.push(metadata);
    manifest.latest = newVersion;
    await this.saveVersionManifest(manifest);

    // Update latest symlink
    await this.updateLatestLink(newVersion);

    logger.info(`Created version ${newVersion} (${changeType})`);
    return metadata;
  }

  async compareVersions(fromVersion: string, toVersion: string): Promise<any> {
    const fromDir = path.join(this.outputDir, `v${fromVersion}`);
    const toDir = path.join(this.outputDir, `v${toVersion}`);

    const fromSnapshot = await this.loadSnapshot(fromDir);
    const toSnapshot = await this.loadSnapshot(toDir);

    return {
      from: fromVersion,
      to: toVersion,
      fromSnapshot,
      toSnapshot
    };
  }

  async getVersionHistory(limit?: number): Promise<ValidationMetadata[]> {
    const manifest = await this.readVersionManifest();
    const versions = [...manifest.versions].sort((a, b) => 
      semver.rcompare(a.version, b.version)
    );
    
    return limit ? versions.slice(0, limit) : versions;
  }

  private async readVersionManifest(): Promise<any> {
    const content = await fs.readFile(this.versionsFile, 'utf-8');
    return JSON.parse(content);
  }

  private async saveVersionManifest(manifest: any): Promise<void> {
    await fs.writeFile(this.versionsFile, JSON.stringify(manifest, null, 2));
  }

  private async saveVersionData(
    versionDir: string,
    metadata: ValidationMetadata,
    snapshot: ExportSnapshot
  ): Promise<void> {
    // Save metadata
    await fs.writeFile(
      path.join(versionDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Save structure
    await fs.writeFile(
      path.join(versionDir, 'structure.json'),
      JSON.stringify(snapshot.structure, null, 2)
    );

    // Save snapshot for future comparisons
    await fs.writeFile(
      path.join(versionDir, 'structure.snapshot.json'),
      JSON.stringify(snapshot, null, 2)
    );

    // Create schemas directory
    const schemasDir = path.join(versionDir, 'schemas');
    await fs.mkdir(schemasDir, { recursive: true });

    // Save individual schema files
    for (const [name, schema] of Object.entries(snapshot.schemas)) {
      const schemaPath = path.join(schemasDir, `${name}.schema.json`);
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
    }
  }

  private async loadSnapshot(versionDir: string): Promise<ExportSnapshot> {
    const snapshotPath = path.join(versionDir, 'structure.snapshot.json');
    const content = await fs.readFile(snapshotPath, 'utf-8');
    return JSON.parse(content);
  }

  private async updateLatestLink(version: string): Promise<void> {
    const latestPath = path.join(this.outputDir, 'latest');
    const versionPath = path.join(this.outputDir, `v${version}`);

    try {
      await fs.unlink(latestPath);
    } catch {
      // Ignore if doesn't exist
    }

    try {
      await fs.symlink(versionPath, latestPath, 'dir');
    } catch (error) {
      logger.warn('Failed to create latest symlink', error);
    }
  }

  private calculateHash(snapshot: ExportSnapshot): string {
    const content = JSON.stringify({
      structure: snapshot.structure,
      schemas: Object.keys(snapshot.schemas).sort()
    });
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}
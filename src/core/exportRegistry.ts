import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('exportRegistry');

export interface ExportTypeConfig {
  name: string;
  description: string;
  outputName: string;
  // Future: could add extractor, validator, etc.
}

export class ExportRegistry {
  private static instance: ExportRegistry;
  private registry: Map<string, ExportTypeConfig> = new Map();

  private constructor() {
    // Initialize with built-in export types
    this.registerDefaults();
  }

  static getInstance(): ExportRegistry {
    if (!ExportRegistry.instance) {
      ExportRegistry.instance = new ExportRegistry();
    }
    return ExportRegistry.instance;
  }

  private registerDefaults(): void {
    // Register known export types
    this.register('telegram', {
      name: 'Telegram Export',
      description: 'Telegram chat export with HTML and media files',
      outputName: 'telegram-export'
    });

    this.register('google-takeout', {
      name: 'Google Takeout',
      description: 'Google account data export',
      outputName: 'google-takeout'
    });

    this.register('twitter-archive', {
      name: 'Twitter Archive',
      description: 'Twitter/X account archive with JS-wrapped JSON files',
      outputName: 'twitter-archive'
    });

    this.register('generic', {
      name: 'Generic Export',
      description: 'Generic data export with mixed file types',
      outputName: 'generic-export'
    });
  }

  register(type: string, config: ExportTypeConfig): void {
    if (this.registry.has(type)) {
      logger.warn(`Export type '${type}' already registered, overwriting`);
    }
    this.registry.set(type, config);
    logger.info(`Registered export type: ${type}`);
  }

  get(type: string): ExportTypeConfig | undefined {
    return this.registry.get(type);
  }

  getOrDefault(type: string): ExportTypeConfig {
    return this.registry.get(type) || this.registry.get('generic')!;
  }

  list(): string[] {
    return Array.from(this.registry.keys());
  }

  getAllConfigs(): Map<string, ExportTypeConfig> {
    return new Map(this.registry);
  }
}

// Export singleton instance
export const exportRegistry = ExportRegistry.getInstance();
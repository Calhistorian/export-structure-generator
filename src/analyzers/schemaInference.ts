import { z } from 'zod';
import * as fs from 'fs/promises';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
import * as yaml from 'yaml';
import { SchemaInferenceOptions } from '../types/index.js';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('schemaInference');

export class SchemaInferenceEngine {
  constructor(private options: SchemaInferenceOptions) {}

  async inferFromFile(filePath: string): Promise<z.ZodType | null> {
    const ext = filePath.toLowerCase().split('.').pop();
    
    try {
      switch (ext) {
        case 'json':
          return await this.inferJsonSchema(filePath);
        case 'csv':
          return await this.inferCsvSchema(filePath);
        case 'xml':
          return await this.inferXmlSchema(filePath);
        case 'yaml':
        case 'yml':
          return await this.inferYamlSchema(filePath);
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Failed to infer schema for ${filePath}`, error);
      return null;
    }
  }

  private async inferJsonSchema(filePath: string): Promise<z.ZodType> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    return this.inferFromValue(data);
  }

  private async inferCsvSchema(filePath: string): Promise<z.ZodType> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors[0].message}`));
            return;
          }
          
          const samples = this.getSamples(results.data);
          const schema = this.inferFromArray(samples);
          resolve(schema);
        }
      });
    });
  }

  private async inferXmlSchema(filePath: string): Promise<z.ZodType> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true
    });
    
    const data = parser.parse(content);
    return this.inferFromValue(data);
  }

  private async inferYamlSchema(filePath: string): Promise<z.ZodType> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.parse(content);
    
    return this.inferFromValue(data);
  }

  private inferFromValue(value: any, depth: number = 0): z.ZodType {
    if (depth > this.options.maxDepth) {
      return z.any();
    }

    if (value === null) {
      return z.null();
    }

    if (value === undefined) {
      return z.undefined();
    }

    const type = typeof value;

    switch (type) {
      case 'string':
        return this.inferStringSchema(value);
      case 'number':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'object':
        if (Array.isArray(value)) {
          return this.inferArraySchema(value, depth);
        }
        return this.inferObjectSchema(value, depth);
      default:
        return z.any();
    }
  }

  private inferStringSchema(value: string): z.ZodType {
    // Check for common string formats
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return z.string().datetime();
    }
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) {
      return z.string().uuid();
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return z.string().email();
    }
    if (/^https?:\/\//.test(value)) {
      return z.string().url();
    }
    
    return z.string();
  }

  private inferArraySchema(arr: any[], depth: number): z.ZodType {
    if (arr.length === 0) {
      return z.array(z.any());
    }

    const samples = this.getSamples(arr);
    const schemas = samples.map(item => this.inferFromValue(item, depth + 1));
    
    // Check if all schemas are the same
    const uniqueSchemas = this.getUniqueSchemas(schemas);
    
    if (uniqueSchemas.length === 1) {
      return z.array(uniqueSchemas[0]);
    }
    
    // Handle heterogeneous arrays
    return z.array(z.union(uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]));
  }

  private inferObjectSchema(obj: Record<string, any>, depth: number): z.ZodType {
    const shape: Record<string, z.ZodType> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      shape[key] = this.inferFromValue(value, depth + 1);
      
      // Handle nullable fields based on mode
      if (this.options.mode === 'strict' && value === null) {
        shape[key] = shape[key].nullable();
      }
    }
    
    return z.object(shape);
  }

  private inferFromArray(arr: any[]): z.ZodType {
    if (arr.length === 0) {
      return z.array(z.any());
    }

    // Collect all keys from all objects
    const allKeys = new Set<string>();
    const keyOccurrences: Record<string, number> = {};
    
    arr.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => {
          allKeys.add(key);
          keyOccurrences[key] = (keyOccurrences[key] || 0) + 1;
        });
      }
    });

    // Build schema based on samples
    const shape: Record<string, z.ZodType> = {};
    
    allKeys.forEach(key => {
      const values = arr.map(item => item?.[key]).filter(v => v !== undefined);
      const nullCount = arr.filter(item => item?.[key] === null).length;
      const missingCount = arr.length - keyOccurrences[key];
      
      if (values.length > 0) {
        const valueSchemas = values.map(v => this.inferFromValue(v, 0));
        const uniqueSchemas = this.getUniqueSchemas(valueSchemas);
        
        let schema = uniqueSchemas.length === 1 
          ? uniqueSchemas[0] 
          : z.union(uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]);
        
        // Handle nullability
        if (this.options.mode === 'strict' && nullCount > 0) {
          schema = schema.nullable();
        } else if (this.options.mode === 'auto' && nullCount / arr.length > 0.05) {
          schema = schema.nullable();
        }
        
        // Handle optional fields
        if (missingCount > 0) {
          shape[key] = schema.optional();
        } else {
          shape[key] = schema;
        }
      }
    });
    
    return z.array(z.object(shape));
  }

  private getSamples<T>(arr: T[]): T[] {
    if (arr.length <= this.options.sampleSize) {
      return arr;
    }

    switch (this.options.sampleStrategy) {
      case 'first':
        return arr.slice(0, this.options.sampleSize);
      
      case 'random':
        const samples: T[] = [];
        const indices = new Set<number>();
        
        while (samples.length < this.options.sampleSize) {
          const index = Math.floor(Math.random() * arr.length);
          if (!indices.has(index)) {
            indices.add(index);
            samples.push(arr[index]);
          }
        }
        return samples;
      
      case 'stratified':
        // Take first 1000 + random 10%
        const firstSamples = arr.slice(0, Math.min(1000, this.options.sampleSize));
        const remainingSize = this.options.sampleSize - firstSamples.length;
        const randomSamples = this.getSamples(arr.slice(1000));
        
        return [...firstSamples, ...randomSamples.slice(0, remainingSize)];
      
      default:
        return arr.slice(0, this.options.sampleSize);
    }
  }

  private getUniqueSchemas(schemas: z.ZodType[]): z.ZodType[] {
    const unique: z.ZodType[] = [];
    const seen = new Set<string>();
    
    schemas.forEach(schema => {
      const key = this.getSchemaKey(schema);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(schema);
      }
    });
    
    return unique;
  }

  private getSchemaKey(schema: z.ZodType): string {
    // Simple schema comparison based on type
    if (schema instanceof z.ZodString) return 'string';
    if (schema instanceof z.ZodNumber) return 'number';
    if (schema instanceof z.ZodBoolean) return 'boolean';
    if (schema instanceof z.ZodNull) return 'null';
    if (schema instanceof z.ZodUndefined) return 'undefined';
    if (schema instanceof z.ZodArray) return 'array';
    if (schema instanceof z.ZodObject) return 'object';
    return 'any';
  }
}
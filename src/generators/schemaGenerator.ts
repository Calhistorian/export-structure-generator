import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { createServiceLogger } from '../lib/logger/index.js';

const logger = createServiceLogger('schemaGenerator');

export class SchemaGenerator {
  async generateZodSchemas(
    schemas: Record<string, z.ZodType>,
    outputDir: string
  ): Promise<void> {
    const schemasDir = path.join(outputDir, 'schemas');
    await fs.mkdir(schemasDir, { recursive: true });

    // Generate individual schema files
    for (const [name, schema] of Object.entries(schemas)) {
      const zodCode = this.generateZodCode(name, schema);
      const fileName = `${name}.schema.ts`;
      await fs.writeFile(path.join(schemasDir, fileName), zodCode);
    }

    // Generate index file
    const indexCode = this.generateIndexFile(Object.keys(schemas));
    await fs.writeFile(path.join(schemasDir, 'index.ts'), indexCode);

    logger.info(`Generated Zod schemas in ${schemasDir}`);
  }

  async generateJsonSchemas(
    schemas: Record<string, z.ZodType>,
    outputDir: string
  ): Promise<void> {
    const schemasDir = path.join(outputDir, 'schemas');
    await fs.mkdir(schemasDir, { recursive: true });

    for (const [name, schema] of Object.entries(schemas)) {
      const jsonSchema = this.zodToJsonSchema(schema);
      const fileName = `${name}.schema.json`;
      await fs.writeFile(
        path.join(schemasDir, fileName),
        JSON.stringify(jsonSchema, null, 2)
      );
    }

    logger.info(`Generated JSON schemas in ${schemasDir}`);
  }

  private generateZodCode(name: string, schema: z.ZodType): string {
    const schemaName = this.toPascalCase(name) + 'Schema';
    const typeName = this.toPascalCase(name);

    const lines: string[] = [];
    
    // Header
    lines.push('// Generated by Export Validator v1.0.0');
    lines.push(`// Date: ${new Date().toISOString()}`);
    lines.push('// Mode: strict');
    lines.push('');
    lines.push("import { z } from 'zod';");
    lines.push('');

    // Schema definition
    lines.push(`export const ${schemaName} = ${this.schemaToCode(schema)};`);
    lines.push('');

    // Type inference
    lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>;`);

    return lines.join('\n');
  }

  private schemaToCode(schema: z.ZodType, indent: number = 0): string {
    const spacing = '  '.repeat(indent);

    if (schema instanceof z.ZodString) {
      let code = 'z.string()';
      
      // Add string validations
      if (schema._def.checks) {
        schema._def.checks.forEach((check: any) => {
          switch (check.kind) {
            case 'email':
              code += '.email()';
              break;
            case 'url':
              code += '.url()';
              break;
            case 'uuid':
              code += '.uuid()';
              break;
            case 'datetime':
              code += '.datetime()';
              break;
            case 'min':
              code += `.min(${check.value})`;
              break;
            case 'max':
              code += `.max(${check.value})`;
              break;
          }
        });
      }
      
      return code;
    }

    if (schema instanceof z.ZodNumber) {
      return 'z.number()';
    }

    if (schema instanceof z.ZodBoolean) {
      return 'z.boolean()';
    }

    if (schema instanceof z.ZodNull) {
      return 'z.null()';
    }

    if (schema instanceof z.ZodUndefined) {
      return 'z.undefined()';
    }

    if (schema instanceof z.ZodArray) {
      const itemSchema = this.schemaToCode(schema._def.type, indent);
      return `z.array(${itemSchema})`;
    }

    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
      const fields = Object.entries(shape).map(([key, value]) => {
        const fieldSchema = this.schemaToCode(value as z.ZodType, indent + 1);
        // Quote keys if they contain spaces or other special characters
        const quotedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        return `${spacing}  ${quotedKey}: ${fieldSchema}`;
      });

      return `z.object({\n${fields.join(',\n')}\n${spacing}})`;
    }

    if (schema instanceof z.ZodUnion) {
      const options = schema._def.options
        .map((opt: z.ZodType) => this.schemaToCode(opt, indent))
        .join(', ');
      return `z.union([${options}])`;
    }

    if (schema instanceof z.ZodOptional) {
      const inner = this.schemaToCode(schema._def.innerType, indent);
      return `${inner}.optional()`;
    }

    if (schema instanceof z.ZodNullable) {
      const inner = this.schemaToCode(schema._def.innerType, indent);
      return `${inner}.nullable()`;
    }

    if (schema instanceof z.ZodEnum) {
      const values = schema._def.values.map((v: string) => `"${v}"`).join(', ');
      return `z.enum([${values}])`;
    }

    return 'z.any()';
  }

  private generateIndexFile(schemaNames: string[]): string {
    const lines: string[] = [];
    
    lines.push('// Export all schemas');
    lines.push('');

    schemaNames.forEach(name => {
      const fileName = `${name}.schema.js`;
      lines.push(`export * from './${fileName}';`);
    });

    return lines.join('\n');
  }

  private zodToJsonSchema(schema: z.ZodType): any {
    // Basic JSON Schema generation
    if (schema instanceof z.ZodString) {
      const jsonSchema: any = { type: 'string' };
      
      if (schema._def.checks) {
        schema._def.checks.forEach((check: any) => {
          switch (check.kind) {
            case 'email':
              jsonSchema.format = 'email';
              break;
            case 'url':
              jsonSchema.format = 'uri';
              break;
            case 'uuid':
              jsonSchema.format = 'uuid';
              break;
            case 'datetime':
              jsonSchema.format = 'date-time';
              break;
            case 'min':
              jsonSchema.minLength = check.value;
              break;
            case 'max':
              jsonSchema.maxLength = check.value;
              break;
          }
        });
      }
      
      return jsonSchema;
    }

    if (schema instanceof z.ZodNumber) {
      return { type: 'number' };
    }

    if (schema instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }

    if (schema instanceof z.ZodNull) {
      return { type: 'null' };
    }

    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodToJsonSchema(schema._def.type)
      };
    }

    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
      const properties: any = {};
      const required: string[] = [];

      Object.entries(shape).forEach(([key, value]) => {
        const fieldSchema = value as z.ZodType;
        
        if (!(fieldSchema instanceof z.ZodOptional)) {
          required.push(key);
        }

        properties[key] = this.zodToJsonSchema(
          fieldSchema instanceof z.ZodOptional 
            ? fieldSchema._def.innerType 
            : fieldSchema
        );
      });

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false
      };
    }

    if (schema instanceof z.ZodUnion) {
      return {
        anyOf: schema._def.options.map((opt: z.ZodType) => this.zodToJsonSchema(opt))
      };
    }

    if (schema instanceof z.ZodOptional) {
      return this.zodToJsonSchema(schema._def.innerType);
    }

    if (schema instanceof z.ZodNullable) {
      const innerSchema = this.zodToJsonSchema(schema._def.innerType);
      return {
        anyOf: [innerSchema, { type: 'null' }]
      };
    }

    if (schema instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: schema._def.values
      };
    }

    return {};
  }

  private toPascalCase(str: string): string {
    // Split on underscores (path separators)
    const parts = str.split(/_/);
    
    return parts
      .map(part => {
        // Clean up non-alphanumeric characters within each part, but preserve spaces
        const cleanPart = part.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
        if (!cleanPart) return '';
        
        // Split on spaces to handle multi-word parts
        const words = cleanPart.split(/\s+/);
        
        return words.map(word => {
          if (!word) return '';
          
          // If the word is all uppercase and longer than 3 chars, convert to title case
          // This preserves acronyms like "URL", "API", "iOS" but converts "YOUTUBE" to "Youtube"
          if (word === word.toUpperCase() && word.length > 3) {
            return word.charAt(0) + word.slice(1).toLowerCase();
          }
          
          // If the word already has mixed case (like "YouTube"), preserve it
          if (word !== word.toLowerCase() && word !== word.toUpperCase()) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          
          // Otherwise, standard title case
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join('');
      })
      .filter(part => part.length > 0)
      .join('');
  }
}
# Export Structure Validator

A powerful CLI tool that analyzes data exports (folders, ZIPs, JSON files) to document their structure, generate type-safe schemas, and detect changes over time. Perfect for maintaining parsers for third-party SaaS exports.

## 🚀 Features

- **Multi-format Support**: Analyze folders, ZIP archives, and individual JSON/CSV/XML/YAML files
- **Schema Generation**: Automatically generate Zod v4 and JSON schemas from your data
- **Change Detection**: Track structural changes between export versions with detailed reports
- **Version Management**: Semantic versioning with complete history tracking
- **Type Safety**: Generate TypeScript-first schemas with proper type inference
- **CI/CD Ready**: Fail builds on breaking changes with configurable severity levels
- **Beautiful Reports**: Markdown, HTML, and JSON output formats

## 📦 Installation

```bash
# Clone and install
git clone https://github.com/yourusername/export-structure-validator.git
cd export-structure-validator
pnpm install

# Build the project
pnpm build
```

## 🔧 Usage

### Basic Analysis

```bash
# Analyze a folder
npx tsx src/cli/index.ts ./my-export-folder

# Analyze a ZIP file
npx tsx src/cli/index.ts ./export.zip

# Analyze a single JSON file
npx tsx src/cli/index.ts ./data.json
```

### Advanced Options

```bash
npx tsx src/cli/index.ts ./export \
  --mode strict \                    # strict|loose|auto schema inference
  --sample-size 5000 \              # Number of records to sample
  --sample-strategy stratified \     # first|random|stratified
  --output ./output/results \       # Output directory (default: ./output/validation-results)
  --format markdown,json,html \     # Report formats
  --auto-version                    # Auto-increment version based on changes
```

### CI/CD Integration

```bash
# Fail on breaking changes
npx tsx src/cli/index.ts ./export --ci --fail-on breaking

# Compare against a specific snapshot
npx tsx src/cli/index.ts ./export --snapshot ./previous.snapshot.json
```

### Version Management

```bash
# View version history
npx tsx src/cli/index.ts history

# Compare two versions
npx tsx src/cli/index.ts compare --from v1.0.0 --to v1.1.0
```

## 📊 Output Structure

```
output/validation-results/
├── v1.2.3/                      # Version directory
│   ├── metadata.json            # Version metadata
│   ├── structure.json           # File tree structure
│   ├── structure.snapshot.json  # Complete snapshot
│   ├── schemas/                 # Generated schemas
│   │   ├── users.schema.ts     # Zod schema
│   │   ├── users.schema.json   # JSON schema
│   │   └── index.ts            # Schema exports
│   ├── changes.json            # Detailed changes
│   ├── report.md               # Markdown report
│   └── report.html             # Interactive HTML report
├── versions.json               # Version manifest
└── latest/                     # Symlink to current version
```

## 🎯 Use Cases

1. **SaaS Export Monitoring**: Track changes in third-party data exports
2. **Parser Maintenance**: Ensure your parsers stay compatible with evolving formats
3. **Schema Documentation**: Auto-generate documentation for data structures
4. **Regression Testing**: Catch breaking changes before they hit production
5. **Data Auditing**: Understand the structure of unknown exports

## 📝 Schema Inference Modes

- **`strict`**: Captures all nullability and optionality exactly as found
- **`loose`**: Ignores rare nulls for cleaner schemas
- **`auto`**: Uses thresholds (>5% nulls = nullable)

## 🔍 Change Detection

The tool detects various types of changes:

- **Breaking Changes** 🔴
  - Type changes (string → number)
  - Field removals
  - Required fields becoming optional
  
- **Minor Changes** 🟡
  - New optional fields
  - Fields becoming nullable
  
- **Patch Changes** 🟢
  - Metadata changes (file size, timestamps)

## 📋 Example Reports

### Markdown Report
```markdown
# Export Structure Validation Report

Version: 1.2.3 → 2.0.0 (BREAKING CHANGES)
Date: 2024-01-15T10:30:00Z

## Breaking Changes

### 🔴 user.profile.email
- Type changed: `string` → `string | null`
- Migration: Add null checks before using email field
```

### Generated Zod Schema
```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  profile: z.object({
    name: z.string(),
    email: z.string().email().nullable(),
    avatar: z.string().url().optional(),
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 🛠️ Development

```bash
# Run in development mode
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📄 License

ISC
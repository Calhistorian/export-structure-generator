# Export Structure Validator

A powerful CLI tool that analyzes data exports (folders, ZIPs, JSON files) to document their structure, generate type-safe schemas, and detect changes over time. Perfect for maintaining parsers for third-party SaaS exports.

The tool uses an export type registry to maintain separate version histories for different export types, ensuring clean tracking and comparison of changes within each export format.

## 🚀 Features

- **Multi-format Support**: Analyze folders, ZIP archives, and individual JSON/CSV/XML/YAML files
- **Export Type Registry**: Built-in support for common export types with isolated version histories
- **Schema Generation**: Automatically generate Zod v4 and JSON schemas from your data
- **Smart Schema Naming**: Clean, readable schema names that preserve original structure
- **Change Detection**: Track structural changes between export versions with detailed reports
- **Version Management**: Semantic versioning with complete history tracking per export type
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
# Analyze a folder (generic export)
npx tsx src/cli/index.ts ./my-export-folder

# Analyze with specific export type
npx tsx src/cli/index.ts ./google-takeout --type google-takeout

# Analyze a ZIP file
npx tsx src/cli/index.ts ./export.zip

# Analyze a single JSON file
npx tsx src/cli/index.ts ./data.json
```

### Advanced Options

```bash
npx tsx src/cli/index.ts ./export \
  --type google-takeout \           # Export type (telegram|google-takeout|twitter-archive|generic)
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
# View version history for a specific export type
npx tsx src/cli/index.ts history --type google-takeout

# Compare two versions of the same export type
npx tsx src/cli/index.ts compare --from v1.0.0 --to v1.1.0 --type google-takeout
```

## 📊 Output Structure

```
output/validation-results/
├── google-takeout/              # Export type directory
│   ├── v1.2.3/                  # Version directory
│   │   ├── metadata.json        # Version metadata
│   │   ├── structure.json       # File tree structure
│   │   ├── structure.snapshot.json  # Complete snapshot
│   │   ├── schemas/             # Generated schemas
│   │   │   ├── users.schema.ts  # Zod schema
│   │   │   ├── users.schema.json # JSON schema
│   │   │   └── index.ts         # Schema exports
│   │   ├── changes.json         # Detailed changes
│   │   ├── report.md            # Markdown report
│   │   └── report.html          # Interactive HTML report
│   ├── versions.json            # Version manifest for this export type
│   └── latest/                  # Symlink to current version
├── twitter-archive/             # Separate directory for Twitter exports
│   └── ...
└── generic-export/              # Default for unspecified types
    └── ...
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

// Clean schema naming: preserves original structure
// File: /data/users.json → Schema: UsersSchema
export const UsersSchema = z.object({
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

export type Users = z.infer<typeof UsersSchema>;
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

## 🔌 Export Type Registry

The validator uses an export type registry to maintain isolated version histories for different export formats. This ensures that changes are tracked within each export type independently.

### How It Works

1. **Export Type Selection**: Specify the export type with `--type` flag
2. **Isolated Directories**: Each export type gets its own output directory
3. **Independent Versioning**: Version histories are maintained separately
4. **Type-Specific Rules**: Future support for custom validation rules per type

### Supported Export Types

| Export Type | Key | Supported Formats | Output Directory | Notes |
|------------|-----|-------------------|------------------|-------|
| Generic | `generic` | JSON, CSV, XML, YAML | `generic-export/` | Default for unknown exports |
| Google Takeout | `google-takeout` | JSON, CSV, XML | `google-takeout/` | Full support |
| Telegram | `telegram` | JSON files only | `telegram-export/` | HTML/media files skipped |
| Twitter Archive | `twitter-archive` | None* | `twitter-archive/` | Requires preprocessing |

*Twitter archives use JavaScript-wrapped JSON that needs preprocessing.

### Preprocessing Twitter Archives

Twitter archives wrap JSON data in JavaScript assignments. Use the included preprocessor:

```bash
# Convert Twitter JS files to JSON
node scripts/preprocess-twitter.js ./twitter-archive

# Then validate the processed data
npx tsx src/cli/index.ts ./twitter-archive/data-json --type twitter-archive
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
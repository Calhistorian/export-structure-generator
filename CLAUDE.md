# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Run
```bash
# Run in development mode with hot reload
pnpm dev

# Build the TypeScript project
pnpm build

# Run the production build
pnpm start

# Run the CLI tool
npx tsx src/cli/index.ts <export-path> [options]
```

### Testing
```bash
# Run all tests
pnpm test

# Run a single test file
pnpm test src/core/__tests__/validator.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI interface
pnpm test:ui
```

### Code Quality
```bash
# Run ESLint
pnpm lint

# Run ESLint with auto-fix
pnpm lint:fix

# Type checking (when available)
pnpm typecheck
```

## High-Level Architecture

This is an Export Structure Validator that analyzes data exports to document structure and detect changes. The architecture follows a modular approach:

### Core Components

1. **Entry Points**
   - `src/cli/index.ts` - Primary CLI interface using Commander.js
   - `src/main.ts` - Demo/documentation entry point

2. **Core Modules** (`src/core/`)
   - **validator.ts** - Main orchestrator that coordinates the validation pipeline
   - **fileProcessor.ts** - Handles file/directory/ZIP traversal and metadata extraction
   - **changeDetection.ts** - Compares snapshots and identifies structural changes
   - **versionManager.ts** - Manages semantic versioning and version history

3. **Analyzers** (`src/analyzers/`)
   - **schemaInference.ts** - Infers Zod schemas from JSON/CSV/XML/YAML data

4. **Generators** (`src/generators/`)
   - **schemaGenerator.ts** - Generates Zod TypeScript code and JSON schemas

5. **Reporters** (`src/reporters/`)
   - **markdownReporter.ts** - Generates human-readable Markdown reports
   - **jsonReporter.ts** - Generates machine-readable JSON reports
   - **htmlReporter.ts** - Generates interactive HTML reports

6. **Type Definitions** (`src/types/`)
   - Central type definitions for the entire application

### Key Patterns

- **Pipeline Architecture**: FileProcessor → SchemaInference → ChangeDetection → Reporting
- **Snapshot-based Comparison**: Each validation creates a versioned snapshot for future comparisons
- **Semantic Versioning**: Automatic version bumping based on change severity
- **Multi-format Support**: Unified handling of JSON, CSV, XML, YAML through adapters
- **Progressive Schema Building**: Handles large datasets through sampling strategies

### CLI Usage Examples

```bash
# Basic validation
npx tsx src/cli/index.ts ./export-folder

# With options
npx tsx src/cli/index.ts ./export.zip --mode loose --format html,json

# CI mode
npx tsx src/cli/index.ts ./export --ci --fail-on breaking

# Version management
npx tsx src/cli/index.ts history
npx tsx src/cli/index.ts compare --from v1.0.0 --to v1.1.0
```

### Important Implementation Details

- Uses Zod for runtime schema validation and type generation
- File processing uses streams for memory efficiency with large exports
- Change detection uses deep-diff for structural comparison
- Version management follows semver principles
- All file paths must be absolute (resolved with path.resolve)
- Schemas are generated with configurable strictness modes
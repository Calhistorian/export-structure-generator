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

# Run the CLI
pnpm cli
```

### Testing
```bash
# Run all tests
pnpm test

# Run a single test file
pnpm test src/lib/api/userService.test.ts

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
```

## High-Level Architecture

This is a modern TypeScript template for Node.js applications with full ESM support. The architecture follows a modular approach with clear separation of concerns:

### Core Components

1. **Entry Points**
   - `src/main.ts` - Main application entry demonstrating utilities usage
   - `src/cli/index.ts` - CLI interface built with Commander.js

2. **Configuration Layer** (`src/config/`)
   - Environment variable management with Zod validation
   - Type-safe access to configuration values
   - Supports both development and production environments

3. **Core Libraries** (`src/lib/`)
   - **logger/** - Winston-based logging system with service-specific loggers
   - **telemetry/** - Performance monitoring utilities for measuring execution time
   - **api/** - Service layer with MSW mocking support for tests

4. **Utilities** (`src/utils/`)
   - **fs.ts** - Basic file operations (readJsonFile, writeJsonFile)
   - **fsEnhanced.ts** - Advanced operations using fs-extra
   - **api.ts** - Axios-based HTTP client with interceptors
   - **http.ts** - Fetch-based HTTP client
   - **data.ts** - Data manipulation (deepClone, groupBy)
   - **validation.ts** - Zod-based validation schemas

5. **Testing Infrastructure**
   - Vitest as test runner with MSW for API mocking
   - Test setup in `__tests__/setup.ts`
   - Mock handlers in `__tests__/mocks/`

### Key Patterns

- **ESM Modules**: All imports use `.js` extensions for proper ESM resolution
- **Type Safety**: Strong TypeScript typing throughout with strict mode enabled
- **Service Loggers**: Create dedicated loggers per service using `createServiceLogger()`
- **Performance Tracking**: Use `startMeasure()` / `endMeasure()` for monitoring
- **Error Handling**: Consistent error handling with proper logging
- **API Mocking**: MSW setup for testing external API interactions

### TypeScript Configuration

- Target: ESNext with ESM module system
- Path alias: `@/*` maps to `src/*` and `lib/*`
- No build required for development (uses tsx/ts-node)
- Strict mode enabled with all type checking features
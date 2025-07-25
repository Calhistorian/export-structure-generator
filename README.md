# TypeScript Project Template

A modern, feature-rich TypeScript template for Node.js applications.

## Features

- 🚀 **Modern TypeScript** - Full ESM support with path aliases
- 📦 **Zero build step** - Run TypeScript directly with ts-node/tsx
- 🧪 **Testing** - Vitest setup with MSW for API mocking
- 📊 **Logging** - Advanced logging with Winston
- 📈 **Performance Monitoring** - Built-in performance measurement utilities
- 🔍 **Type Safety** - Strong typing throughout the codebase
- 🛠️ **CLI Tools** - Command-line interface using Commander
- ⚙️ **Environment Management** - Type-safe environment variables with Zod validation
- 🔄 **API Utilities** - Fetch and Axios clients with proper error handling

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/typescript-template.git my-project
cd my-project

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server with hot reload
pnpm dev

# Run the CLI
pnpm cli

# Run tests
pnpm test
```

### Building for Production

```bash
# Build the project
pnpm build

# Start the production server
pnpm start
```

## Project Structure

```
src/
├── config/        # Configuration management
├── lib/           # Core libraries and utilities
│   ├── api/       # API clients and services
│   ├── logger/    # Logging system
│   └── telemetry/ # Performance monitoring
├── utils/         # Utility functions
├── test/          # Test setup and utilities
│   └── mocks/     # Mock data and services
├── cli/           # Command-line interface
└── main.ts        # Application entry point
```

## Utilities

### File System

- `fs.ts` - Basic file system operations
- `fsEnhanced.ts` - Advanced file system utilities using fs-extra

### HTTP/API

- `http.ts` - Fetch-based HTTP client with error handling
- `api.ts` - Axios-based API client with interceptors

### Data Handling

- `data.ts` - Type-safe data manipulation utilities

### Validation

- `validation.ts` - Input validation using Zod

## Testing

This template uses Vitest for testing and MSW (Mock Service Worker) for API mocking.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## CLI

The template includes a CLI built with Commander:

```bash
# Run the CLI
pnpm cli

# Show environment information
pnpm cli info

# Run a performance test
pnpm cli perf-test --iterations 5000
```

## License

ISC 
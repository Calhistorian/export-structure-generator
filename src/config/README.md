# Configuration System

This directory contains all configuration logic for the project, including environment variable management and validation.

## Goals
- Centralize and validate all environment configuration
- Provide type-safe access to configuration values
- Support multiple environments (development, test, production)

## Key Files
- `env.ts`: Loads, validates, and exports environment variables using Zod and dotenv.
- `index.ts`: Exports all configuration modules for easy import.

## Usage
Import configuration anywhere in your code:
```ts
import { env, isProduction } from "@/config";
```

## Extending
Add new configuration modules as needed and export them from `index.ts`. 
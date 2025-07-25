# Utility Functions (`utils`)

This directory contains general-purpose utility modules for common tasks across the application.

## Goals
- Provide reusable, type-safe helpers for common operations
- Keep business logic clean and DRY
- Facilitate rapid prototyping and robust production code

## Main Utilities
- `fs.ts` — Basic file system operations (read/write, JSON, etc.)
- `fsEnhanced.ts` — Advanced file system utilities using fs-extra
- `http.ts` — Fetch-based HTTP client with error handling
- `api.ts` — Axios-based API client with interceptors and type validation
- `data.ts` — Data manipulation and transformation helpers
- `validation.ts` — Input validation using Zod
- `greeting.ts` — Example utility for demonstration

## Usage
Import utilities as needed, e.g.:
```ts
import { readJsonFile } from "@/utils/fs";
import { validateEmail } from "@/utils/validation";
```

## Extending
Add new utility modules for common patterns. Keep each file focused and well-typed. 
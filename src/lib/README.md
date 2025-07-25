# Library Utilities (`lib`)

This directory contains core libraries and utilities that power the application's infrastructure.

## Goals
- Provide reusable, well-tested building blocks for the application
- Encapsulate cross-cutting concerns (logging, telemetry, API clients)
- Promote code reuse and maintainability

## Submodules
- `api/` — API service clients and helpers (e.g., axios wrappers, typed clients)
- `logger/` — Centralized logging system (Winston-based, with dev/prod formatters)
- `telemetry/` — Performance monitoring and metrics utilities

## Usage
Import utilities as needed, e.g.:
```ts
import { logger } from "@/lib/logger";
import { startMeasure } from "@/lib/telemetry/performance";
```

## Extending
Add new libraries as subdirectories or modules. Keep each concern isolated and well-documented. 
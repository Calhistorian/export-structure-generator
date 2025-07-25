# Command Line Interface (`cli`)

This directory contains the application's command-line interface (CLI) entry point and related commands.

## Goals
- Provide a user-friendly CLI for interacting with the application
- Enable automation, scripting, and developer productivity
- Expose key utilities (info, performance test, etc.)

## Key File
- `index.ts`: Main CLI entry point, built with Commander.js

## Usage
Run the CLI with:
```bash
pnpm cli [command]
```

Example commands:
- `pnpm cli info` — Show environment information
- `pnpm cli perf-test --iterations 1000` — Run a performance test

## Extending
Add new commands to `index.ts` using Commander.js. Keep commands focused and well-documented. 
# Testing System

This directory contains all test setup, mocks, and utilities for the project.

## Goals
- Ensure code quality and reliability through automated testing
- Provide a robust, modern testing environment
- Enable API mocking and isolated unit/integration tests

## Key Components
- `setup.ts`: Global test setup for Vitest (runs before each test)
- `mocks/`: Mock data and MSW (Mock Service Worker) handlers for API mocking

## Testing Tools
- **Vitest**: Fast, modern test runner for TypeScript
- **MSW**: Mock Service Worker for API mocking in tests

## Usage
- Place test files alongside source files or in this directory
- Use `pnpm test`, `pnpm test:watch`, or `pnpm test:coverage` to run tests

## Extending
- Add new mocks to `mocks/`
- Add global setup/teardown logic to `setup.ts`
- Follow best practices for test isolation and coverage 
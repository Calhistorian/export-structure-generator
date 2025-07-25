/**
 * Enhanced File System Utilities
 *
 * Extends the basic fs utilities with fs-extra capabilities.
 * Provides a more robust file system API with error handling and type safety.
 */

import * as fsExtra from "fs-extra";
import { JsonWriteOptions } from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { glob as globAsync } from "glob";
import { z } from "zod";

/**
 * Get current module's directory name in ESM context
 * @param importMetaUrl - import.meta.url from the calling module
 * @returns The directory name of the calling module
 */
export function getDirname(importMetaUrl: string): string {
  const filename = fileURLToPath(importMetaUrl);
  return path.dirname(filename);
}

/**
 * Schema for a file entry
 */
export const FileEntrySchema = z.object({
  path: z.string(),
  name: z.string(),
  ext: z.string(),
  isFile: z.boolean(),
  isDirectory: z.boolean(),
  isSymlink: z.boolean(),
  size: z.number().optional(),
  mtimeMs: z.number().optional(),
  birthtime: z.date().optional(),
  mtime: z.date().optional(),
});

export type FileEntry = z.infer<typeof FileEntrySchema>;

/**
 * Read a JSON file and parse its contents
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON data with proper type inference
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    return (await fsExtra.readJson(filePath)) as T;
  } catch (error) {
    throw new Error(
      `Failed to read JSON file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Write data to a JSON file
 * @param filePath - Path to write the JSON file
 * @param data - Data to serialize as JSON
 * @param options - Optional fs-extra options
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  options: JsonWriteOptions = { spaces: 2 }
): Promise<void> {
  try {
    await fsExtra.ensureDir(path.dirname(filePath));
    await fsExtra.writeJson(filePath, data, options);
  } catch (error) {
    throw new Error(
      `Failed to write JSON file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Read a file to a string
 * @param filePath - Path to the file
 * @param encoding - File encoding (default: utf8)
 * @returns File contents as string
 */
export async function readTextFile(
  filePath: string,
  encoding: BufferEncoding = "utf8"
): Promise<string> {
  try {
    return await fsExtra.readFile(filePath, { encoding });
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Write a string to a file
 * @param filePath - Path to write the file
 * @param data - String data to write
 * @param options - Optional fs-extra options
 */
export async function writeTextFile(
  filePath: string,
  data: string,
  options: fsExtra.WriteFileOptions = {}
): Promise<void> {
  try {
    await fsExtra.ensureDir(path.dirname(filePath));
    await fsExtra.writeFile(filePath, data, options);
  } catch (error) {
    throw new Error(
      `Failed to write file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Read a file to a buffer
 * @param filePath - Path to the file
 * @returns File contents as buffer
 */
export async function readBinaryFile(filePath: string): Promise<Buffer> {
  try {
    return await fsExtra.readFile(filePath);
  } catch (error) {
    throw new Error(
      `Failed to read binary file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Write a buffer to a file
 * @param filePath - Path to write the file
 * @param data - Buffer data to write
 * @param options - Optional fs-extra options
 */
export async function writeBinaryFile(
  filePath: string,
  data: Buffer | Uint8Array,
  options: fsExtra.WriteFileOptions = {}
): Promise<void> {
  try {
    await fsExtra.ensureDir(path.dirname(filePath));
    await fsExtra.writeFile(filePath, data as any, options);
  } catch (error) {
    throw new Error(
      `Failed to write binary file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Find files matching a glob pattern
 * @param pattern - Glob pattern to match
 * @param options - Optional glob options
 * @returns Array of matching file paths
 */
export async function findFiles(
  pattern: string,
  options: Parameters<typeof globAsync>[1] = {}
): Promise<string[]> {
  try {
    const result = await globAsync(pattern, options);
    return result.map((p) => p.toString());
  } catch (error) {
    throw new Error(
      `Failed to find files with pattern "${pattern}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get detailed information about files matching a glob pattern
 * @param pattern - Glob pattern to match
 * @param options - Optional glob options
 * @returns Array of file entries with detailed information
 */
export async function findFileEntries(
  pattern: string,
  options: Parameters<typeof globAsync>[1] = {}
): Promise<FileEntry[]> {
  try {
    const filePaths = await findFiles(pattern, options);

    const entries: FileEntry[] = [];
    for (const filePath of filePaths) {
      try {
        const stats = await fsExtra.stat(filePath);
        const parsed = path.parse(filePath);

        entries.push({
          path: filePath,
          name: parsed.name,
          ext: parsed.ext,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymlink: stats.isSymbolicLink(),
          size: stats.size,
          mtime: new Date(stats.mtime),
          mtimeMs: stats.mtimeMs,
          birthtime: new Date(stats.birthtime),
        });
      } catch (err) {
        console.warn(`Couldn't get stats for ${filePath}:`, err);
      }
    }

    return entries;
  } catch (error) {
    throw new Error(
      `Failed to find file entries with pattern "${pattern}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a temporary directory
 * @param options - Optional options
 * @returns Path to the created temporary directory
 */
export async function createTempDir(
  options: {
    prefix?: string;
    inMemory?: boolean;
  } = {}
): Promise<string> {
  try {
    const prefix = options.prefix || "tmp-";
    const basePath = options.inMemory
      ? "/tmp" // For Node.js processes where RAM disk might be available
      : path.join(process.cwd(), "temp");

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const dirPath = path.join(basePath, `${prefix}${timestamp}-${randomStr}`);

    await fsExtra.ensureDir(dirPath);
    return dirPath;
  } catch (error) {
    throw new Error(
      `Failed to create temporary directory: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Watch a file or directory for changes
 * @param targetPath - Path to watch
 * @param callback - Callback function to run on changes
 * @param options - Watch options
 * @returns Function to stop watching
 */
export function watchPath(
  targetPath: string,
  callback: (event: string, path: string) => void,
  options: {
    recursive?: boolean;
    filter?: (path: string) => boolean;
  } = {}
): () => void {
  try {
    const watcher = fsExtra.watch(
      targetPath,
      { recursive: options.recursive },
      (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(targetPath, filename);

        if (options.filter && !options.filter(fullPath)) {
          return;
        }

        callback(eventType, fullPath);
      }
    );

    // Return a function to stop watching
    return () => {
      watcher.close();
    };
  } catch (error) {
    throw new Error(
      `Failed to watch path ${targetPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a file watcher that batches events
 * @param targetPath - Path to watch
 * @param callback - Callback function to run on changes
 * @param options - Watch options
 * @returns Function to stop watching
 */
export function createBatchedWatcher(
  targetPath: string,
  callback: (events: Array<{ event: string; path: string }>) => void,
  options: {
    recursive?: boolean;
    filter?: (path: string) => boolean;
    debounceMs?: number;
  } = {}
): () => void {
  const debounceMs = options.debounceMs || 300;
  const events: Array<{ event: string; path: string }> = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const processEvents = () => {
    if (events.length > 0) {
      callback([...events]);
      events.length = 0;
    }
    timeoutId = null;
  };

  const watcher = watchPath(
    targetPath,
    (event, path) => {
      events.push({ event, path });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(processEvents, debounceMs);
    },
    options
  );

  // Return a function to stop watching
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    watcher();
  };
}

// Add more fs-extra based utilities as exports
export const ensureDir = fsExtra.ensureDir;
export const copy = fsExtra.copy;
export const move = fsExtra.move;
export const remove = fsExtra.remove;
export const emptyDir = fsExtra.emptyDir;
export const exists = fsExtra.exists;
export const pathExists = fsExtra.pathExists;

export default {
  // Basic utilities
  getDirname,

  // Schemas
  FileEntrySchema,

  // File operations
  readJsonFile,
  writeJsonFile,
  readTextFile,
  writeTextFile,
  readBinaryFile,
  writeBinaryFile,

  // Search operations
  findFiles,
  findFileEntries,

  // Temp operations
  createTempDir,

  // Watch operations
  watchPath,
  createBatchedWatcher,

  // Re-exports from fs-extra
  ensureDir,
  copy,
  move,
  remove,
  emptyDir,
  exists,
  pathExists,
};

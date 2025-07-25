/**
 * File System Utilities
 *
 * Provides enhanced file system operations for prototyping and development.
 * Wraps native fs/promises and fs-extra functionality with error handling and type safety.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
 * Read a JSON file and parse its contents
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON data with proper type inference
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) as T;
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
 * @param pretty - Whether to format the JSON with indentation
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  pretty = true
): Promise<void> {
  try {
    const jsonString = pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // Ensure the directory exists
    const dirname = path.dirname(filePath);
    await fs.mkdir(dirname, { recursive: true });

    await fs.writeFile(filePath, jsonString, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to write JSON file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check if a file or directory exists
 * @param filePath - Path to check
 * @returns Boolean indicating if the path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get information about a file or directory
 * @param filePath - Path to check
 * @returns Object with information about the file or null if it doesn't exist
 */
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  isDirectory?: boolean;
  isFile?: boolean;
  size?: number;
  modifiedTime?: Date;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      size: stats.size,
      modifiedTime: new Date(stats.mtime),
    };
  } catch {
    return { exists: false };
  }
}

/**
 * List files and directories in a given directory
 * @param dirPath - Directory path to list
 * @param options - Optional filtering options
 * @returns Array of file and directory names
 */
export async function listDirectory(
  dirPath: string,
  options: {
    filesOnly?: boolean;
    dirsOnly?: boolean;
    fullPaths?: boolean;
  } = {}
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let results = entries
      .filter((entry) => {
        if (options.filesOnly) return entry.isFile();
        if (options.dirsOnly) return entry.isDirectory();
        return true;
      })
      .map((entry) =>
        options.fullPaths ? path.join(dirPath, entry.name) : entry.name
      );

    return results;
  } catch (error) {
    throw new Error(
      `Failed to list directory ${dirPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a temporary file with optional content
 * @param content - Optional content to write to the file
 * @param extension - Optional file extension (default: .tmp)
 * @returns Path to the created temporary file
 */
export async function createTempFile(
  content?: string,
  extension = ".tmp"
): Promise<string> {
  try {
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const filePath = path.join(
      tempDir,
      `temp-${timestamp}-${randomStr}${extension}`
    );

    if (content !== undefined) {
      await fs.writeFile(filePath, content, "utf8");
    } else {
      await fs.writeFile(filePath, "", "utf8");
    }

    return filePath;
  } catch (error) {
    throw new Error(
      `Failed to create temporary file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Copy a file or directory recursively
 * @param source - Source path
 * @param destination - Destination path
 */
export async function copyPath(
  source: string,
  destination: string
): Promise<void> {
  try {
    const stats = await fs.stat(source);

    if (stats.isDirectory()) {
      await fs.mkdir(destination, { recursive: true });
      const entries = await fs.readdir(source);

      for (const entry of entries) {
        const srcPath = path.join(source, entry);
        const destPath = path.join(destination, entry);
        await copyPath(srcPath, destPath);
      }
    } else {
      await fs.copyFile(source, destination);
    }
  } catch (error) {
    throw new Error(
      `Failed to copy ${source} to ${destination}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export default {
  getDirname,
  readJsonFile,
  writeJsonFile,
  pathExists,
  getFileInfo,
  listDirectory,
  createTempFile,
  copyPath,
};

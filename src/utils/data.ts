/**
 * Data Utilities
 *
 * Provides common data manipulation, validation, and transformation functions.
 * Type-safe utilities for working with various data structures.
 */

// Type guard utilities
/**
 * Type guard for checking if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for checking if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard for checking if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard for checking if a value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for checking if a value is an array
 */
export function isArray<T>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Type guard for checking if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Data transformation utilities
/**
 * Deep clone an object or array
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    const result = new Map();
    obj.forEach((value, key) => {
      result.set(key, deepClone(value));
    });
    return result as unknown as T;
  }

  if (obj instanceof Set) {
    const result = new Set();
    for (const value of obj) {
      result.add(deepClone(value));
    }
    return result as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }

  return result as T;
}

/**
 * Deep merge objects
 */
export function deepMerge<
  T extends Record<string, any>,
  U extends Record<string, any>
>(target: T, source: U): T & U {
  const result = { ...target } as T & U;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        // Both values are objects, merge them recursively
        result[key as keyof T & U] = deepMerge(targetValue, sourceValue) as any;
      } else {
        // Either value is not an object, overwrite with source value
        result[key as keyof T & U] = sourceValue as any;
      }
    });
  }

  return result;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Group array elements by a key or keying function
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyOrFn: keyof T | ((item: T) => K)
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key =
      typeof keyOrFn === "function"
        ? keyOrFn(item)
        : (item[keyOrFn] as unknown as K);

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * Chunk an array into groups of a specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Flatten a nested array
 */
export function flatten<T>(arr: Array<T | T[]>): T[] {
  return arr.reduce(
    (result: T[], item) =>
      result.concat(Array.isArray(item) ? flatten(item) : item),
    [] as T[]
  );
}

/**
 * Create an array of unique values
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Sort an array of objects by a property
 */
export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => number | string),
  order: "asc" | "desc" = "asc"
): T[] {
  const compareFn = (a: T, b: T): number => {
    const valueA = typeof key === "function" ? key(a) : a[key];
    const valueB = typeof key === "function" ? key(b) : b[key];

    if (valueA < valueB) return order === "asc" ? -1 : 1;
    if (valueA > valueB) return order === "asc" ? 1 : -1;
    return 0;
  };

  return [...array].sort(compareFn);
}

/**
 * Convert a value to a number, with fallback
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Convert a value to a boolean
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowercased = value.toLowerCase().trim();
    return lowercased === "true" || lowercased === "1" || lowercased === "yes";
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return Boolean(value);
}

/**
 * Generate a random ID
 */
export function randomId(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Check if an object is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
}

export default {
  // Type guards
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isDate,
  isArray,
  isObject,

  // Data transformation
  deepClone,
  deepMerge,
  pick,
  omit,
  groupBy,
  chunk,
  flatten,
  unique,
  sortBy,

  // Conversion
  toNumber,
  toBoolean,

  // Utility
  randomId,
  isEmpty,
};

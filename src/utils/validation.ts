/**
 * Validation Utilities
 *
 * Provides validation functions for common data types.
 * Use these functions to validate input data before processing.
 */

/**
 * Validation error with details about validation failures
 */
export class ValidationError extends Error {
  errors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[] = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  path?: string;
  message: string;
  value?: any;
}

/**
 * Validate that a value is not null or undefined
 * @throws {ValidationError} If validation fails
 */
export function validateRequired(value: any, path?: string): void {
  if (value === null || value === undefined) {
    throw new ValidationError("Value is required", [
      { path, message: "Value is required" },
    ]);
  }
}

/**
 * Validate that a value is a string
 * @throws {ValidationError} If validation fails
 */
export function validateString(
  value: any,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "String is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      path: options.path,
      message: "Value must be a string",
      value,
    });
  } else {
    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push({
        path: options.path,
        message: `String must be at least ${options.minLength} characters long`,
        value,
      });
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push({
        path: options.path,
        message: `String must not exceed ${options.maxLength} characters`,
        value,
      });
    }

    if (options.pattern && !options.pattern.test(value)) {
      errors.push({
        path: options.path,
        message: "String does not match the required pattern",
        value,
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate that a value is a number
 * @throws {ValidationError} If validation fails
 */
export function validateNumber(
  value: any,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "Number is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (typeof value !== "number" || isNaN(value)) {
    errors.push({
      path: options.path,
      message: "Value must be a number",
      value,
    });
  } else {
    if (options.min !== undefined && value < options.min) {
      errors.push({
        path: options.path,
        message: `Number must be at least ${options.min}`,
        value,
      });
    }

    if (options.max !== undefined && value > options.max) {
      errors.push({
        path: options.path,
        message: `Number must not exceed ${options.max}`,
        value,
      });
    }

    if (options.integer && !Number.isInteger(value)) {
      errors.push({
        path: options.path,
        message: "Number must be an integer",
        value,
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate that a value is a boolean
 * @throws {ValidationError} If validation fails
 */
export function validateBoolean(
  value: any,
  options: {
    required?: boolean;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "Boolean is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (typeof value !== "boolean") {
    errors.push({
      path: options.path,
      message: "Value must be a boolean",
      value,
    });
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate that a value is a Date
 * @throws {ValidationError} If validation fails
 */
export function validateDate(
  value: any,
  options: {
    required?: boolean;
    min?: Date;
    max?: Date;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "Date is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  const isValidDate = value instanceof Date && !isNaN(value.getTime());
  if (!isValidDate) {
    errors.push({
      path: options.path,
      message: "Value must be a valid Date",
      value,
    });
  } else {
    if (options.min && value < options.min) {
      errors.push({
        path: options.path,
        message: `Date must not be before ${options.min.toISOString()}`,
        value,
      });
    }

    if (options.max && value > options.max) {
      errors.push({
        path: options.path,
        message: `Date must not be after ${options.max.toISOString()}`,
        value,
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate that a value is an array
 * @throws {ValidationError} If validation fails
 */
export function validateArray(
  value: any,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: any, index: number) => void;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "Array is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push({
      path: options.path,
      message: "Value must be an array",
      value,
    });
  } else {
    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push({
        path: options.path,
        message: `Array must contain at least ${options.minLength} items`,
        value,
      });
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push({
        path: options.path,
        message: `Array must not contain more than ${options.maxLength} items`,
        value,
      });
    }

    if (options.itemValidator) {
      value.forEach((item, index) => {
        try {
          options.itemValidator!(item, index);
        } catch (error) {
          if (error instanceof ValidationError) {
            error.errors.forEach((itemError) => {
              const itemPath = options.path
                ? `${options.path}[${index}]${
                    itemError.path ? `${itemError.path}` : ""
                  }`
                : `[${index}]${itemError.path ? `${itemError.path}` : ""}`;

              errors.push({
                path: itemPath,
                message: itemError.message,
                value: itemError.value,
              });
            });
          } else {
            errors.push({
              path: options.path ? `${options.path}[${index}]` : `[${index}]`,
              message: error instanceof Error ? error.message : String(error),
              value: item,
            });
          }
        }
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate that a value matches a regex pattern
 * @throws {ValidationError} If validation fails
 */
export function validatePattern(
  value: any,
  pattern: RegExp,
  options: {
    required?: boolean;
    path?: string;
    message?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({
      path: options.path,
      message: options.message || "Value is required",
      value,
    });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      path: options.path,
      message: options.message || "Value must be a string",
      value,
    });
  } else if (!pattern.test(value)) {
    errors.push({
      path: options.path,
      message: options.message || "Value does not match the required pattern",
      value,
    });
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validate an email address
 */
export function validateEmail(
  value: any,
  options: {
    required?: boolean;
    path?: string;
  } = {}
): void {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validatePattern(value, emailRegex, {
    required: options.required,
    path: options.path,
    message: "Invalid email address",
  });
}

/**
 * Validate a URL
 */
export function validateUrl(
  value: any,
  options: {
    required?: boolean;
    protocols?: string[];
    requireProtocol?: boolean;
    path?: string;
  } = {}
): void {
  const errors: ValidationErrorDetail[] = [];

  if (options.required && (value === null || value === undefined)) {
    errors.push({ path: options.path, message: "URL is required", value });
    throw new ValidationError("Validation failed", errors);
  }

  // If not required and undefined/null, skip validation
  if (!options.required && (value === null || value === undefined)) {
    return;
  }

  if (typeof value !== "string") {
    errors.push({ path: options.path, message: "URL must be a string", value });
    throw new ValidationError("Validation failed", errors);
  }

  try {
    const url = new URL(
      options.requireProtocol
        ? value
        : value.includes("://")
        ? value
        : `https://${value}`
    );

    if (options.protocols && options.protocols.length > 0) {
      const protocol = url.protocol.replace(":", "");
      if (!options.protocols.includes(protocol)) {
        errors.push({
          path: options.path,
          message: `URL protocol must be one of: ${options.protocols.join(
            ", "
          )}`,
          value,
        });
      }
    }
  } catch (error) {
    errors.push({ path: options.path, message: "Invalid URL", value });
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

export default {
  validateRequired,
  validateString,
  validateNumber,
  validateBoolean,
  validateDate,
  validateArray,
  validatePattern,
  validateEmail,
  validateUrl,
  ValidationError,
};

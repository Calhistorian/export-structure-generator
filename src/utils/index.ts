/**
 * Utilities Index
 *
 * Exports all utility modules for easier imports.
 */

export * from "./fs.js";
export * from "./http.js";
export * from "./data.js";
export * from "./validation.js";

// Re-export default exports
import fsUtils from "./fs.js";
import httpUtils from "./http.js";
import dataUtils from "./data.js";
import validationUtils from "./validation.js";

// Export as a single default object
export default {
  fs: fsUtils,
  http: httpUtils,
  data: dataUtils,
  validation: validationUtils,
};

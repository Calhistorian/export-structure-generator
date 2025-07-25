/**
 * API Client Utilities
 *
 * Provides an enhanced API client based on axios with additional features
 * like request/response handling, error management, and caching.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";

/**
 * API error with additional context
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  data?: any;

  constructor(error: AxiosError) {
    const status = error.response?.status || 0;
    const statusText = error.response?.statusText || "Unknown Error";
    const url = error.config?.url || "unknown-url";

    super(`API Error ${status} (${statusText}): ${error.message}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = error.response?.data;
    this.stack = error.stack;
  }
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  validateStatus?: (status: number) => boolean;
  responseType?: "json" | "text" | "blob" | "arraybuffer";

  // Additional options
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

/**
 * API Request context
 */
export interface ApiRequestContext {
  abortController?: AbortController;
  startTime?: number;
}

/**
 * Simple in-memory cache implementation
 */
class RequestCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    // Default TTL: 1 minute
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a cached response
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a cached response
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Delete a cached response
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached responses
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate a cache key from request parameters
   */
  generateKey(config: AxiosRequestConfig): string {
    const { method = "get", url = "", params, data } = config;

    return JSON.stringify({
      method: method.toLowerCase(),
      url,
      params: params ? JSON.stringify(params) : undefined,
      data: data ? JSON.stringify(data) : undefined,
    });
  }
}

/**
 * Enhanced API client based on axios
 */
export class ApiClient {
  private axios: AxiosInstance;
  private cache: RequestCache;
  private config: ApiClientConfig;

  /**
   * Create a new API client
   */
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 0,
      retryDelay: 1000,
      cache: false,
      cacheTTL: 60000,
      ...config,
    };

    this.cache = new RequestCache(this.config.cacheTTL);

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      headers: this.config.headers,
      timeout: this.config.timeout,
      withCredentials: this.config.withCredentials,
      validateStatus: this.config.validateStatus,
      responseType: this.config.responseType,
    });

    // Set up interceptors
    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add request timestamp for performance tracking
        (config as any).startTime = Date.now();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const startTime = (response.config as any).startTime;
        if (startTime) {
          const duration = Date.now() - startTime;
          response.headers["x-request-duration"] = duration.toString();
        }

        return response;
      },
      (error: AxiosError) => {
        // Transform axios error to ApiError
        if (error.response) {
          return Promise.reject(new ApiError(error));
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: "get", url });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: "post", url, data });
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: "put", url, data });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: "patch", url, data });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: "delete", url });
  }

  /**
   * Make a request with retries and caching
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const { retries, retryDelay, cache } = this.config;

    // Check cache first if enabled and method is GET
    if (cache && config.method?.toLowerCase() === "get") {
      const cacheKey = this.cache.generateKey(config);
      const cachedData = this.cache.get<T>(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Set up abort controller if not provided
    const context: ApiRequestContext = {};
    if (!config.signal) {
      context.abortController = new AbortController();
      config.signal = context.abortController.signal;
    }

    // Make the request with retries
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= (retries || 0)) {
      try {
        const response = await this.axios.request<T>(config);

        // Cache the successful response if enabled and method is GET
        if (cache && config.method?.toLowerCase() === "get") {
          const cacheKey = this.cache.generateKey(config);
          this.cache.set(cacheKey, response.data);
        }

        return response.data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's a 4xx error (except 429) or request was aborted
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 429
        ) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }

        // If we've hit the max retries, throw the last error
        if (retryCount === retries) {
          throw lastError;
        }

        // Wait before retrying
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    // This should never happen, but TypeScript needs it
    throw lastError || new Error("Unknown error occurred during request");
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(message?: string): void {
    // Not supported directly in Axios V1, would need to implement a custom solution
  }

  /**
   * Clear the request cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create an API client with type validation using Zod
 */
export function createTypedApiClient<T extends Record<string, z.ZodType>>(
  schemas: T,
  config: ApiClientConfig = {}
): {
  client: ApiClient;
  api: {
    [K in keyof T]: (
      url: string,
      config?: AxiosRequestConfig
    ) => Promise<z.infer<T[K]>>;
  };
} {
  const client = new ApiClient(config);

  const api = {} as any;

  for (const [key, schema] of Object.entries(schemas)) {
    api[key] = async (
      url: string,
      config: AxiosRequestConfig = {}
    ): Promise<any> => {
      const data = await client.get(url, config);
      return schema.parse(data);
    };
  }

  return { client, api };
}

/**
 * Create a new API client
 */
export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  return new ApiClient(config);
}

export default {
  createApiClient,
  createTypedApiClient,
  ApiClient,
  ApiError,
};

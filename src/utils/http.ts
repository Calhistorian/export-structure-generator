/**
 * HTTP Client Utilities
 *
 * Provides a simple and typed HTTP client for making API requests.
 * Wraps fetch API with error handling, type safety, and common patterns.
 */

/**
 * HTTP request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: RequestCache;
  retries?: number;
  retryDelay?: number;
  responseType?: "json" | "text" | "blob" | "arrayBuffer";
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * HTTP error with additional context
 */
export class HttpError extends Error {
  status: number;
  statusText: string;
  url: string;
  responseData?: any;

  constructor(response: Response, responseData?: any) {
    super(`HTTP Error ${response.status} (${response.statusText})`);
    this.name = "HttpError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.url = response.url;
    this.responseData = responseData;
  }
}

/**
 * HTTP client for making API requests
 */
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  /**
   * Create a new HTTP client
   * @param config - Client configuration
   */
  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl || "";
    this.defaultHeaders = config.defaultHeaders || {};
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retries = config.retries || 0;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  /**
   * Make a GET request
   * @param url - URL to request
   * @param options - Request options
   * @returns Response data with type inference
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("GET", url, undefined, options);
  }

  /**
   * Make a POST request
   * @param url - URL to request
   * @param data - Data to send
   * @param options - Request options
   * @returns Response data with type inference
   */
  async post<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>("POST", url, data, options);
  }

  /**
   * Make a PUT request
   * @param url - URL to request
   * @param data - Data to send
   * @param options - Request options
   * @returns Response data with type inference
   */
  async put<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>("PUT", url, data, options);
  }

  /**
   * Make a PATCH request
   * @param url - URL to request
   * @param data - Data to send
   * @param options - Request options
   * @returns Response data with type inference
   */
  async patch<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>("PATCH", url, data, options);
  }

  /**
   * Make a DELETE request
   * @param url - URL to request
   * @param options - Request options
   * @returns Response data with type inference
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("DELETE", url, undefined, options);
  }

  /**
   * Make a generic HTTP request
   * @param method - HTTP method
   * @param url - URL to request
   * @param data - Data to send
   * @param options - Request options
   * @returns Response data with type inference
   */
  async request<T>(
    method: string,
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const fullUrl = this.resolveUrl(url);

    const headers = {
      ...this.defaultHeaders,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const requestInit: RequestInit = {
      method,
      headers,
      cache: options.cache,
    };

    if (data !== undefined) {
      requestInit.body = JSON.stringify(data);
    }

    const timeout = options.timeout || this.timeout;
    const retries =
      options.retries !== undefined ? options.retries : this.retries;
    const retryDelay = options.retryDelay || this.retryDelay;

    return this.fetchWithRetry<T>(fullUrl, requestInit, {
      timeout,
      retries,
      retryDelay,
      responseType: options.responseType || "json",
    });
  }

  /**
   * Perform fetch with retry capability and timeout
   */
  private async fetchWithRetry<T>(
    url: string,
    init: RequestInit,
    options: {
      timeout: number;
      retries: number;
      retryDelay: number;
      responseType: "json" | "text" | "blob" | "arrayBuffer";
    }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, options.retryDelay)
          );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
          const response = await fetch(url, {
            ...init,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          let responseData: any;

          if (response.status !== 204) {
            // No Content
            try {
              switch (options.responseType) {
                case "json":
                  responseData = await response.json();
                  break;
                case "text":
                  responseData = await response.text();
                  break;
                case "blob":
                  responseData = await response.blob();
                  break;
                case "arrayBuffer":
                  responseData = await response.arrayBuffer();
                  break;
              }
            } catch (e) {
              if (!response.ok) {
                // If we can't parse the response but it's an error, we still want to throw
                throw new HttpError(response);
              }

              // For successful responses, we still try to continue even if parsing fails
              console.warn(
                `Failed to parse response as ${options.responseType}:`,
                e
              );
              responseData = null;
            }
          }

          if (!response.ok) {
            throw new HttpError(response, responseData);
          }

          return responseData as T;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's an abort error (timeout) or we've hit max retries
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error(`Request timed out after ${options.timeout}ms`);
        }

        // If we're out of retry attempts, throw the last error
        if (attempt === options.retries) {
          throw lastError;
        }
      }
    }

    // This should never happen, but TypeScript needs it
    throw lastError || new Error("Unknown error occurred during request");
  }

  /**
   * Resolve a URL against the base URL
   */
  private resolveUrl(url: string): string {
    if (!url.startsWith("http") && this.baseUrl) {
      return `${this.baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
    }
    return url;
  }
}

/**
 * Create a new HTTP client
 * @param config - Client configuration
 * @returns HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  return new HttpClient(config);
}

export default {
  createHttpClient,
  HttpClient,
  HttpError,
};

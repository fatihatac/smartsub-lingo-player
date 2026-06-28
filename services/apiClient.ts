/**
 * Centralized API client with retry, abort, and GET deduplication.
 * Uses VITE_API_URL as base URL (empty string = relative path for nginx reverse proxy).
 * Attaches VITE_API_KEY as x-api-key header for rate limiting.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export const DEFAULT_MAX_RETRIES = 3;

export interface RetryOptions {
  maxRetries?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = RETRYABLE_STATUSES.has(status);
  }
}

// In-flight GET request deduplication map
const inflightRequests = new Map<string, Promise<unknown>>();

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }
  return headers;
}

async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body === "object") {
        // Backend uses "detail" (FastAPI standard) or "error" for error messages
        const detail = (body as Record<string, unknown>).detail ?? (body as Record<string, unknown>).error;
        if (typeof detail === "string") {
          message = detail;
        }
      }
    } catch {
      // Response body is not JSON, use default message
    }
    throw new ApiError(response.status, message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Guard against non-JSON responses (e.g. Vite SPA fallback index.html on 200)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("application/json")) {
    throw new ApiError(
      502,
      `Server returned a non-JSON response (Content-Type: ${contentType || "missing"}). The API endpoint may be unreachable or misrouted.`,
    );
  }

  try {
    return response.json();
  } catch {
    throw new ApiError(
      502,
      "Malformed JSON response (the upstream may have returned an error page).",
    );
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) return error.retryable;
  // Network errors (TypeError from fetch) are retryable
  if (error instanceof TypeError) return true;
  return false;
}

async function backoff(attempt: number, signal?: AbortSignal): Promise<void> {
  const delay = 1000 * Math.pow(2, attempt);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      };
      if (signal.aborted) {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: RetryOptions,
): Promise<unknown> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const signal = options?.signal;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal });
      return await handleResponse(response);
    } catch (error) {
      lastError = error;

      // Don't retry on abort
      if (signal?.aborted) throw error;

      // Don't retry non-retryable errors (e.g. 4xx except 429)
      if (!isRetryable(error)) throw error;

      // Don't sleep after the last attempt
      if (attempt < maxRetries) {
        await backoff(attempt, signal);
      }
    }
  }

  throw lastError;
}

export async function apiGet(
  path: string,
  options?: RetryOptions,
): Promise<unknown> {
  const url = API_BASE_URL + path;

  // Deduplicate in-flight GET requests
  const existing = inflightRequests.get(url);
  if (existing) return existing;

  const promise = fetchWithRetry(
    url,
    { method: "GET", headers: buildHeaders() },
    options,
  ).finally(() => {
    inflightRequests.delete(url);
  });

  inflightRequests.set(url, promise);
  return promise;
}

export async function apiPost(
  path: string,
  body: unknown,
  options?: RetryOptions,
): Promise<unknown> {
  const url = API_BASE_URL + path;
  return fetchWithRetry(
    url,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    },
    options,
  );
}

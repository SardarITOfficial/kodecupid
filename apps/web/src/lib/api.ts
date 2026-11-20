export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** Per-field messages produced by the shared zod schemas on the API. */
  get fieldErrors(): Record<string, string> {
    const value = (this.details as { fieldErrors?: Record<string, string> } | undefined)
      ?.fieldErrors;
    return value ?? {};
  }
}

type Audience = 'member' | 'admin' | 'none';

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: Audience;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * Browser client for the proxied API. Cookies are sent automatically because
 * every call is same-origin (`/api/v1/...` is rewritten by Next.js).
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, headers = {} } = options;

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'same-origin',
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach KodeCupid. Check your connection.', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorBody = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(
      errorBody?.code ?? 'UNKNOWN_ERROR',
      errorBody?.message ?? 'Something went wrong. Please try again.',
      response.status,
      errorBody?.details,
    );
  }

  return payload as T;
}

/** Multipart upload (photos) — no JSON content type so the browser sets the boundary. */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`/api/v1${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorBody = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(
      errorBody?.code ?? 'UPLOAD_FAILED',
      errorBody?.message ?? 'That photo could not be uploaded.',
      response.status,
      errorBody?.details,
    );
  }

  return payload as T;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

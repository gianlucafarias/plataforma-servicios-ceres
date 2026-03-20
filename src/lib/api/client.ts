import type { ApiMeta } from '@/lib/api-response';

export type QueryValue = string | number | boolean | null | undefined;

export type NormalizedPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, QueryValue>;
  json?: unknown;
  body?: BodyInit | null;
};

type EnvelopeSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

type EnvelopeFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

type Envelope<T> = EnvelopeSuccess<T> | EnvelopeFailure;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      requestId?: string;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status ?? 500;
    this.code = options.code ?? 'api_error';
    this.details = options.details;
    this.requestId = options.requestId;

    if ('cause' in Error.prototype || options.cause !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).cause = options.cause;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEnvelope<T>(value: unknown): value is Envelope<T> {
  return isRecord(value) && typeof value.success === 'boolean';
}

function toApiUrl(path: string) {
  if (path.startsWith('/api/v1/')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `/api/v1${path}`;
  }

  return `/api/v1/${path}`;
}

function withQuery(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(toApiUrl(path), 'http://localhost');

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return `${url.pathname}${url.search}`;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => '');
  return text.length > 0 ? text : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta?: ApiMeta; status: number }> {
  const { query, json, body, headers, credentials, ...init } = options;
  const requestHeaders = new Headers(headers);
  let requestBody = body ?? null;

  if (json !== undefined) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    requestBody = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(withQuery(path, query), {
      ...init,
      credentials: credentials ?? 'include',
      headers: requestHeaders,
      body: requestBody,
    });
  } catch (error) {
    throw new ApiClientError('No se pudo conectar con el servidor.', {
      status: 0,
      code: 'network_error',
      cause: error,
    });
  }

  const payload = await readPayload(response);

  if (isEnvelope<T>(payload)) {
    if (payload.success) {
      return {
        data: payload.data,
        meta: payload.meta,
        status: response.status,
      };
    }

    throw new ApiClientError(
      payload.error?.message || 'Ocurrio un error al procesar la solicitud.',
      {
        status: response.status,
        code: payload.error?.code,
        details: payload.error?.details,
        requestId: payload.meta?.requestId,
      }
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      typeof payload === 'string' && payload.trim().length > 0
        ? payload
        : `Error ${response.status}: ${response.statusText}`,
      {
        status: response.status,
        code: 'invalid_response',
      }
    );
  }

  return {
    data: payload as T,
    status: response.status,
  };
}

export function normalizePagination(
  meta?: ApiMeta,
  fallbackCount = 0
): NormalizedPagination {
  return {
    page: meta?.pagination?.page ?? 1,
    pageSize: meta?.pagination?.pageSize ?? fallbackCount,
    total: meta?.pagination?.total ?? fallbackCount,
    totalPages: meta?.pagination?.totalPages ?? (fallbackCount > 0 ? 1 : 0),
  };
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}


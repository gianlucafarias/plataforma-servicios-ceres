export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiMeta = {
  requestId: string;
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: ApiError;
  meta?: ApiMeta;
};

export function ok<T>(data: T, meta?: ApiMeta): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function fail(code: string, message: string, details?: unknown, meta?: ApiMeta): ApiFailure {
  return { success: false, error: { code, message, ...(details ? { details } : {}) }, ...(meta ? { meta } : {}) };
}

export function requestMeta(req: Request, extras?: Partial<ApiMeta>): ApiMeta {
  const requestId =
    req.headers.get('x-request-id') ||
    req.headers.get('x-cf-ray') ||
    req.headers.get('x-vercel-id') ||
    crypto.randomUUID();

  return { requestId, ...(extras ?? {}) };
}

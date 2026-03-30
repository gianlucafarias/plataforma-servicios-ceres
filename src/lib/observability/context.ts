import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { clientIp } from '@/lib/request-helpers';

export type ObservabilityActorType = 'admin_user' | 'end_user' | 'system';
export type ObservabilityEventKind = 'audit' | 'workflow' | 'request';
export type ObservabilityEventStatus =
  | 'success'
  | 'failure'
  | 'warning'
  | 'skipped';

export type ObservabilityActor = {
  type: ObservabilityActorType;
  id?: string | null;
  label?: string | null;
  email?: string | null;
  role?: string | null;
};

export type RequestObservationContext = {
  requestId: string;
  route: string;
  path: string;
  method: string;
  clientIp: string;
  userAgent: string | null;
  actor: ObservabilityActor;
  startedAt: number;
};

export const ADMIN_CONTEXT_HEADERS = {
  userId: 'x-admin-user-id',
  username: 'x-admin-username',
  email: 'x-admin-email',
  role: 'x-admin-role',
  signature: 'x-admin-context-signature',
} as const;

function requestPath(request: Request | NextRequest): string {
  if ('nextUrl' in request && request.nextUrl?.pathname) {
    return request.nextUrl.pathname;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return '/';
  }
}

export function getRequestId(request: Request | NextRequest): string {
  return (
    request.headers.get('x-request-id') ||
    request.headers.get('x-cf-ray') ||
    request.headers.get('x-vercel-id') ||
    randomUUID()
  );
}

export function buildAdminContextSignature(input: {
  userId: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  requestId: string;
}, secret: string): string {
  return createHmac('sha256', secret)
    .update(
      [
        input.userId,
        input.username ?? '',
        input.email ?? '',
        input.role ?? '',
        input.requestId,
      ].join('|'),
    )
    .digest('hex');
}

function hasValidAdminSignature(input: {
  request: Request | NextRequest;
  requestId: string;
  userId: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
}) {
  const secret =
    process.env.SERVICES_PROXY_CONTEXT_SECRET || process.env.ADMIN_API_KEY;
  const signature = input.request.headers.get(ADMIN_CONTEXT_HEADERS.signature);

  if (!secret || !signature) {
    return false;
  }

  const expected = buildAdminContextSignature(
    {
      userId: input.userId,
      username: input.username,
      email: input.email,
      role: input.role,
      requestId: input.requestId,
    },
    secret,
  );

  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (
    providedBuffer.length === 0 ||
    providedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function resolveAdminActor(
  request: Request | NextRequest,
  requestId: string,
): ObservabilityActor {
  const userId = request.headers.get(ADMIN_CONTEXT_HEADERS.userId);
  const username = request.headers.get(ADMIN_CONTEXT_HEADERS.username);
  const email = request.headers.get(ADMIN_CONTEXT_HEADERS.email);
  const role = request.headers.get(ADMIN_CONTEXT_HEADERS.role);

  if (
    userId &&
    hasValidAdminSignature({
      request,
      requestId,
      userId,
      username,
      email,
      role,
    })
  ) {
    return {
      type: 'admin_user',
      id: userId,
      label: username || email || userId,
      email,
      role,
    };
  }

  return {
    type: 'system',
    label: 'system:admin_api_key',
  };
}

export function createEndUserActor(input: {
  userId?: string | null;
  label?: string | null;
  email?: string | null;
}): ObservabilityActor {
  return {
    type: 'end_user',
    id: input.userId ?? null,
    label: input.label ?? input.email ?? input.userId ?? 'end_user',
    email: input.email ?? null,
  };
}

export function createSystemActor(label: string): ObservabilityActor {
  return {
    type: 'system',
    label,
  };
}

export function createRequestObservationContext(
  request: Request | NextRequest,
  options: {
    route: string;
    actor?: ObservabilityActor;
    requestId?: string;
  },
): RequestObservationContext {
  return {
    requestId: options.requestId ?? getRequestId(request),
    route: options.route,
    path: requestPath(request),
    method: request.method.toUpperCase(),
    clientIp: clientIp(request),
    userAgent: request.headers.get('user-agent'),
    actor: options.actor ?? createSystemActor('system'),
    startedAt: Date.now(),
  };
}

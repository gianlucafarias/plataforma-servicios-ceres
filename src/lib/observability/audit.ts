import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { emitCentralOpsEvent } from '@/lib/central-ops';
import type {
  ObservabilityActor,
  ObservabilityEventKind,
  ObservabilityEventStatus,
  RequestObservationContext,
} from '@/lib/observability/context';
import { observabilityMetrics } from '@/lib/observability/metrics';

type AuditPayload = {
  kind: ObservabilityEventKind;
  domain: string;
  eventName: string;
  status: ObservabilityEventStatus;
  summary: string;
  actor?: ObservabilityActor;
  requestId?: string | null;
  route?: string | null;
  method?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  durationMs?: number | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  'verificationurl',
  'reseturl',
  'idtoken',
  'accesstoken',
] as const;

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((candidate) => normalized.includes(candidate));
}

export function maskEmail(value: string | null | undefined) {
  if (!value || !value.includes('@')) {
    return value ?? null;
  }

  const [local, domain] = value.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

export function sanitizeForAudit(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForAudit(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, current]) => {
        if (isSensitiveKey(key)) {
          return [key, '[REDACTED]'];
        }

        if (key.toLowerCase().includes('email') && typeof current === 'string') {
          return [key, maskEmail(current)];
        }

        return [key, sanitizeForAudit(current)];
      }),
    );
  }

  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return '[URL_REDACTED]';
  }

  return value;
}

export function buildChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  const diff: Record<string, { before: unknown; after: unknown }> = {};
  keys.forEach((key) => {
    const previous = before?.[key];
    const next = after?.[key];

    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      diff[key] = {
        before: sanitizeForAudit(previous),
        after: sanitizeForAudit(next),
      };
    }
  });

  return diff;
}

function logStructured(
  level: 'info' | 'warn' | 'error',
  payload: Record<string, unknown>,
) {
  const logger =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;

  logger(
    JSON.stringify({
      service: 'plataforma-servicios-ceres',
      level,
      timestamp: new Date().toISOString(),
      ...payload,
    }),
  );
}

export async function safeRecordAuditEvent(payload: AuditPayload) {
  const sanitizedChanges = sanitizeForAudit(payload.changes);
  const sanitizedMetadata = sanitizeForAudit(payload.metadata);

  try {
    await prisma.auditEvent.create({
      data: {
        kind: payload.kind,
        domain: payload.domain,
        eventName: payload.eventName,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        actorType: payload.actor?.type ?? 'system',
        actorId: payload.actor?.id ?? null,
        actorLabel: payload.actor?.label ?? null,
        requestId: payload.requestId ?? null,
        route: payload.route ?? null,
        method: payload.method ?? null,
        status: payload.status,
        durationMs:
          payload.durationMs !== undefined && payload.durationMs !== null
            ? Math.round(payload.durationMs)
            : null,
        summary: payload.summary,
        changes:
          sanitizedChanges && typeof sanitizedChanges === 'object'
            ? (sanitizedChanges as Prisma.InputJsonValue)
            : undefined,
        metadata:
          sanitizedMetadata && typeof sanitizedMetadata === 'object'
            ? (sanitizedMetadata as Prisma.InputJsonValue)
            : undefined,
      },
    });

    observabilityMetrics.recordAuditEvent(
      payload.kind,
      payload.domain,
      payload.eventName,
      payload.status,
    );

    await emitCentralOpsEvent({
      kind: payload.kind,
      domain: payload.domain,
      eventName: payload.eventName,
      status: payload.status,
      summary: payload.summary,
      actor: payload.actor,
      requestId: payload.requestId ?? null,
      route: payload.route ?? null,
      path:
        sanitizedMetadata &&
        typeof sanitizedMetadata === 'object' &&
        typeof (sanitizedMetadata as Record<string, unknown>).path === 'string'
          ? ((sanitizedMetadata as Record<string, unknown>).path as string)
          : payload.route ?? null,
      method: payload.method ?? null,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      durationMs:
        payload.durationMs !== undefined && payload.durationMs !== null
          ? Math.round(payload.durationMs)
          : null,
      changes:
        sanitizedChanges && typeof sanitizedChanges === 'object'
          ? (sanitizedChanges as Record<string, unknown>)
          : null,
      metadata:
        sanitizedMetadata && typeof sanitizedMetadata === 'object'
          ? (sanitizedMetadata as Record<string, unknown>)
          : null,
    });
  } catch (error) {
    logStructured('error', {
      msg: 'audit_event_write_failed',
      auditDomain: payload.domain,
      auditEventName: payload.eventName,
      requestId: payload.requestId ?? null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function slowRequestThresholdMs() {
  const parsed = Number.parseInt(process.env.OBS_SLOW_REQUEST_MS || '1500', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1500;
}

async function maybePersistRequestEvent(input: {
  context: RequestObservationContext;
  statusCode: number;
  durationMs: number;
}) {
  const isFailure = input.statusCode >= 500;
  const isSlow = input.durationMs >= slowRequestThresholdMs();
  if (!isFailure && !isSlow) {
    return;
  }

  await safeRecordAuditEvent({
    kind: 'request',
    domain: 'http',
    eventName: isFailure ? 'request.failed' : 'request.slow',
    status: isFailure ? 'failure' : 'warning',
    summary: `${input.context.method} ${input.context.route} -> ${input.statusCode}`,
    actor: input.context.actor,
    requestId: input.context.requestId,
    route: input.context.route,
    method: input.context.method,
    durationMs: input.durationMs,
    metadata: {
      path: input.context.path,
      statusCode: input.statusCode,
      clientIp: input.context.clientIp,
      userAgent: input.context.userAgent,
    },
  });
}

export async function finalizeObservedResponse(
  context: RequestObservationContext,
  response: NextResponse,
) {
  const durationMs = Date.now() - context.startedAt;
  const statusCode = response.status;
  const level =
    statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  response.headers.set('x-request-id', context.requestId);

  observabilityMetrics.recordHttpRequest(
    context.method,
    context.route,
    statusCode,
    durationMs,
  );

  logStructured(level, {
    msg: 'http_request',
    requestId: context.requestId,
    route: context.route,
    path: context.path,
    method: context.method,
    statusCode,
    durationMs,
    actorType: context.actor.type,
    actorId: context.actor.id ?? null,
  });

  await maybePersistRequestEvent({
    context,
    statusCode,
    durationMs,
  });

  return response;
}

export async function observedJson(
  context: RequestObservationContext,
  body: unknown,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);
  return finalizeObservedResponse(context, response);
}

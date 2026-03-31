import type { ObservabilityActor } from '@/lib/observability/context';

const CENTRAL_SOURCE = 'plataforma-servicios-ceres';
const DEFAULT_TIMEOUT_MS = 2500;
let warnedMissingConfig = false;

type CentralOpsEventInput = {
  kind: 'audit' | 'workflow' | 'request';
  domain: string;
  eventName: string;
  status: 'success' | 'failure' | 'warning' | 'skipped';
  summary: string;
  actor?: ObservabilityActor;
  requestId?: string | null;
  route?: string | null;
  path?: string | null;
  method?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  durationMs?: number | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

type CentralEmailJobInput = {
  templateKey:
    | 'services.email_verification'
    | 'services.professional_approved'
    | 'services.password_reset'
    | 'services.verification_resend';
  recipient: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  actor?: ObservabilityActor;
  requestId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  providerStrategy?: 'resend-first' | 'smtp-first' | 'resend-only' | 'smtp-only';
};

function getConfig() {
  const baseUrl = process.env.CERES_API_BASE_URL?.trim();
  const apiKey =
    process.env.CERES_API_OPS_API_KEY?.trim() ||
    process.env.OPS_API_KEY?.trim() ||
    process.env.ADMIN_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        '[central-ops] CERES_API_BASE_URL / CERES_API_OPS_API_KEY no estan configuradas. La emision central queda deshabilitada.',
      );
    }
    return null;
  }

  return {
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
    apiKey,
  };
}

function getTimeoutMs() {
  const parsed = Number.parseInt(
    process.env.CENTRAL_OBSERVABILITY_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS),
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

async function centralFetch(path: string, body: Record<string, unknown>, requestId?: string | null) {
  const config = getConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        ...(requestId ? { 'x-request-id': requestId } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(getTimeoutMs()),
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => '');
      console.warn(
        `[central-ops] ${path} respondio ${response.status}: ${payload.slice(0, 300)}`,
      );
      return null;
    }

    return response.json().catch(() => null);
  } catch (error) {
    console.warn(
      `[central-ops] fallo ${path}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    return null;
  }
}

export async function emitCentralOpsEvent(input: CentralOpsEventInput) {
  await centralFetch(
    '/api/v1/ops/events',
    {
      source: CENTRAL_SOURCE,
      kind: input.kind,
      domain: input.domain,
      eventName: input.eventName,
      status: input.status,
      summary: input.summary,
      actorType: input.actor?.type ?? 'system',
      actorId: input.actor?.id ?? undefined,
      actorLabel: input.actor?.label ?? undefined,
      actorEmail: input.actor?.email ?? undefined,
      actorRole: input.actor?.role ?? undefined,
      requestId: input.requestId ?? undefined,
      route: input.route ?? undefined,
      path: input.path ?? undefined,
      method: input.method ?? undefined,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      durationMs: input.durationMs ?? undefined,
      changes: input.changes ?? undefined,
      metadata: input.metadata ?? undefined,
      occurredAt: new Date().toISOString(),
    },
    input.requestId,
  );
}

export async function enqueueCentralEmailJob(input: CentralEmailJobInput) {
  return centralFetch(
    '/api/v1/ops/jobs/email',
    {
      templateKey: input.templateKey,
      recipient: input.recipient,
      source: CENTRAL_SOURCE,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
      requestId: input.requestId ?? undefined,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      actor: input.actor
        ? {
            type: input.actor.type,
            id: input.actor.id ?? undefined,
            label: input.actor.label ?? undefined,
            email: input.actor.email ?? undefined,
            role: input.actor.role ?? undefined,
          }
        : undefined,
      metadata: input.metadata ?? undefined,
      providerStrategy: input.providerStrategy ?? 'resend-first',
    },
    input.requestId,
  );
}

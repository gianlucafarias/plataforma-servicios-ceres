import type { ObservabilityActor } from '@/lib/observability/context';
import { maskEmail, safeRecordAuditEvent } from '@/lib/observability/audit';
import { observabilityMetrics } from '@/lib/observability/metrics';

type EmailObservation = {
  requestId?: string | null;
  actor?: ObservabilityActor;
  entityType?: string | null;
  entityId?: string | null;
  channel: 'smtp' | 'resend';
  template: string;
  domain: string;
  summary: string;
  recipient?: string | null;
  metadata?: Record<string, unknown>;
};

function baseMetadata(input: EmailObservation) {
  return {
    channel: input.channel,
    template: input.template,
    recipient: maskEmail(input.recipient ?? null),
    ...(input.metadata ?? {}),
  };
}

export async function recordEmailRequested(input: EmailObservation) {
  observabilityMetrics.recordEmailEvent(
    input.channel,
    input.template,
    'requested',
  );

  await safeRecordAuditEvent({
    kind: 'workflow',
    domain: input.domain,
    eventName: `${input.template}.requested`,
    status: 'success',
    summary: input.summary,
    actor: input.actor,
    requestId: input.requestId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: baseMetadata(input),
  });
}

export async function recordEmailSent(input: EmailObservation) {
  observabilityMetrics.recordEmailEvent(input.channel, input.template, 'sent');

  await safeRecordAuditEvent({
    kind: 'workflow',
    domain: input.domain,
    eventName: `${input.template}.sent`,
    status: 'success',
    summary: input.summary,
    actor: input.actor,
    requestId: input.requestId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: baseMetadata(input),
  });
}

export async function recordEmailSkipped(
  input: EmailObservation,
  reason: string,
) {
  observabilityMetrics.recordEmailEvent(
    input.channel,
    input.template,
    'skipped',
  );

  await safeRecordAuditEvent({
    kind: 'workflow',
    domain: input.domain,
    eventName: `${input.template}.skipped`,
    status: 'skipped',
    summary: `${input.summary} (${reason})`,
    actor: input.actor,
    requestId: input.requestId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: {
      ...baseMetadata(input),
      reason,
    },
  });
}

export async function recordEmailFailed(
  input: EmailObservation,
  error: unknown,
) {
  observabilityMetrics.recordEmailEvent(
    input.channel,
    input.template,
    'failed',
  );

  await safeRecordAuditEvent({
    kind: 'workflow',
    domain: input.domain,
    eventName: `${input.template}.failed`,
    status: 'failure',
    summary: input.summary,
    actor: input.actor,
    requestId: input.requestId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: {
      ...baseMetadata(input),
      error: error instanceof Error ? error.message : 'Unknown error',
    },
  });
}

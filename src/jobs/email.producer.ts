import { createHash } from 'crypto';
import { getAbsoluteUrl } from '@/lib/seo';
import { enqueueCentralEmailJob } from '@/lib/central-ops';
import type { ObservabilityActor } from '@/lib/observability/context';
import {
  recordEmailSkipped,
} from '@/lib/observability/email';

function hashIdempotencyPart(value: string) {
  return createHash('sha1').update(value).digest('hex');
}

interface BaseObservabilityInput {
  observability?: {
    requestId?: string | null;
    actor?: ObservabilityActor;
  };
}

interface EnqueueEmailVerifyParams extends BaseObservabilityInput {
  userId: string;
  token?: string | null;
  email: string;
  firstName?: string;
}

export async function enqueueEmailVerify(params: EnqueueEmailVerifyParams) {
  const { token, email, firstName, observability } = params;
  const eventBase = {
    requestId: observability?.requestId,
    actor: observability?.actor,
    entityType: 'user',
    entityId: params.userId,
    channel: 'resend' as const,
    template: 'email.verification',
    domain: 'auth.email',
    summary: `Correo de verificacion solicitado para usuario ${params.userId}`,
    recipient: email,
  };

  if (process.env.DISABLE_EMAIL_VERIFICATION === 'true') {
    await recordEmailSkipped(eventBase, 'email_verification_disabled');
    return null;
  }

  if (!token) {
    await recordEmailSkipped(eventBase, 'missing_verification_token');
    return null;
  }

  const verifyUrl = getAbsoluteUrl(
    `/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
  );

  return enqueueCentralEmailJob({
    templateKey: 'services.email_verification',
    recipient: email,
    payload: {
      firstName,
      verificationUrl: verifyUrl,
    },
    idempotencyKey: `services.email_verification:${params.userId}:${hashIdempotencyPart(token)}`,
    requestId: observability?.requestId,
    actor: observability?.actor,
    entityType: 'user',
    entityId: params.userId,
  });
}

export async function enqueueEmailWelcome(
  userId: string,
  email: string,
  firstName?: string,
) {
  void userId;
  void email;
  void firstName;
  return null;
}

interface EnqueueProfessionalApprovedEmailParams extends BaseObservabilityInput {
  professionalId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export async function enqueueProfessionalApprovedEmail(
  params: EnqueueProfessionalApprovedEmailParams,
) {
  return enqueueCentralEmailJob({
    templateKey: 'services.professional_approved',
    recipient: params.email,
    payload: {
      firstName: params.firstName ?? undefined,
      lastName: params.lastName ?? undefined,
      loginUrl: getAbsoluteUrl('/auth/login?callbackUrl=/dashboard'),
    },
    idempotencyKey: `services.professional_approved:${params.professionalId}`,
    requestId: params.observability?.requestId,
    actor: params.observability?.actor,
    entityType: 'professional',
    entityId: params.professionalId,
  });
}

interface EnqueuePasswordResetEmailParams extends BaseObservabilityInput {
  userId: string;
  email: string;
  firstName?: string | null;
  resetUrl: string;
}

export async function enqueuePasswordResetEmail(
  params: EnqueuePasswordResetEmailParams,
) {
  return enqueueCentralEmailJob({
    templateKey: 'services.password_reset',
    recipient: params.email,
    payload: {
      firstName: params.firstName ?? undefined,
      resetUrl: params.resetUrl,
    },
    idempotencyKey: `services.password_reset:${params.userId}:${hashIdempotencyPart(params.resetUrl)}`,
    requestId: params.observability?.requestId,
    actor: params.observability?.actor,
    entityType: 'user',
    entityId: params.userId,
  });
}

interface EnqueueVerificationResendEmailParams extends BaseObservabilityInput {
  userId: string;
  email: string;
  verificationUrl: string;
}

export async function enqueueVerificationResendEmail(
  params: EnqueueVerificationResendEmailParams,
) {
  return enqueueCentralEmailJob({
    templateKey: 'services.verification_resend',
    recipient: params.email,
    payload: {
      verificationUrl: params.verificationUrl,
    },
    idempotencyKey: `services.verification_resend:${params.userId}:${hashIdempotencyPart(params.verificationUrl)}`,
    requestId: params.observability?.requestId,
    actor: params.observability?.actor,
    entityType: 'user',
    entityId: params.userId,
  });
}

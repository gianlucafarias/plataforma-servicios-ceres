import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAbsoluteUrl } from '@/lib/seo';
import {
  enqueuePasswordResetEmail,
  enqueueVerificationResendEmail,
} from '@/jobs/email.producer';
import type { ObservabilityActor } from '@/lib/observability/context';
import { generateRandomToken } from '@/lib/utils';

export const PASSWORD_FORGOT_RATE_LIMIT = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
} as const;

export const VERIFY_RESEND_RATE_LIMIT = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
} as const;

export function normalizeEmailInput(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const email = value.trim();
  return email.length > 0 ? email : null;
}

type AuthRecoveryObservability = {
  requestId?: string | null;
  actor?: ObservabilityActor;
};

export async function createPasswordResetRequest(
  email: string,
  observability?: AuthRecoveryObservability,
): Promise<{ userFound: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, password: true },
  });

  if (!user || !user.password) {
    return { userFound: false };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = getAbsoluteUrl(`/auth/reset-password?token=${token}`);
  try {
    await enqueuePasswordResetEmail({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      resetUrl,
      observability,
    });
  } catch (emailError) {
    console.error('[forgot-password] Error encolando email central:', emailError);
  }

  return { userFound: true };
}

export type ResendVerificationResult =
  | { status: 'not_found' }
  | { status: 'already_verified' }
  | { status: 'resent' };

export async function resendVerificationEmail(
  email: string,
  observability?: AuthRecoveryObservability,
): Promise<ResendVerificationResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, verified: true },
  });

  if (!user) {
    return { status: 'not_found' };
  }

  if (user.verified) {
    return { status: 'already_verified' };
  }

  await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

  const token = generateRandomToken(48);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const verifyUrl = getAbsoluteUrl(
    `/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );

  try {
    await enqueueVerificationResendEmail({
      userId: user.id,
      email,
      verificationUrl: verifyUrl,
      observability,
    });
  } catch (error) {
    console.error('Error reenviando correo central:', error);
  }

  return { status: 'resent' };
}

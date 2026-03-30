// Email processing using Resend

import { Resend } from 'resend';
import { getAbsoluteUrl } from '@/lib/seo';
import { sendMail } from '@/lib/mail';
import type { ObservabilityActor } from '@/lib/observability/context';
import {
  recordEmailFailed,
  recordEmailRequested,
  recordEmailSent,
  recordEmailSkipped,
} from '@/lib/observability/email';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

interface EnqueueEmailVerifyParams {
  userId: string;
  token: string;
  email: string;
  firstName?: string;
  observability?: {
    requestId?: string | null;
    actor?: ObservabilityActor;
  };
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
    console.log(
      '[email-verify] Email de verificacion deshabilitado (DISABLE_EMAIL_VERIFICATION=true)',
    );
    return null;
  }

  const verifyUrl = getAbsoluteUrl(
    `/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
  );

  const resend = getResendClient();
  if (!resend) {
    await recordEmailSkipped(eventBase, 'resend_not_configured');
    console.warn(
      '[email-verify] RESEND_API_KEY no esta configurada. No se envio el email.',
    );

    return null;
  }

  try {
    await recordEmailRequested(eventBase);

    const result = await resend.emails.send({
      from: 'Ceres en Red <no-reply@ceresenred.ceres.gob.ar>',
      to: email,
      subject: 'Confirma tu cuenta - Ceres en Red',
      html: `
        <p>Hola ${firstName || ''},</p>
        <p>Bienvenido a <strong>Ceres en Red</strong>.</p>
        <p>Para activar tu cuenta, hace clic en el siguiente boton:</p>
        <p>
          <a
            href="${verifyUrl}"
            style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
          >
            Confirmar mi cuenta
          </a>
        </p>
        <p>Si no creaste esta cuenta, podes ignorar este correo.</p>
      `,
    });

    await recordEmailSent({
      ...eventBase,
      metadata: {
        resendId: result?.data?.id ?? null,
      },
    });

    console.log('[email-verify] Email de verificacion enviado con Resend:', result);
    return result;
  } catch (emailError) {
    await recordEmailFailed(eventBase, emailError);
    console.error('[email-verify] Error enviando email con Resend:', emailError);
    throw emailError;
  }
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

interface EnqueueProfessionalApprovedEmailParams {
  professionalId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  observability?: {
    requestId?: string | null;
    actor?: ObservabilityActor;
  };
}

export async function enqueueProfessionalApprovedEmail(
  params: EnqueueProfessionalApprovedEmailParams,
) {
  const { professionalId, email, firstName, lastName, observability } = params;
  const loginUrl = getAbsoluteUrl('/auth/login?callbackUrl=/dashboard');
  const recipientName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const greeting = recipientName ? `Hola ${recipientName}` : 'Hola';

  await sendMail({
    to: email,
    subject: 'Tu perfil fue aprobado - Ceres en Red',
    html: `
      <p>${greeting},</p>
      <p>Tu perfil profesional en <strong>Ceres en Red</strong> fue aprobado por el equipo de administracion.</p>
      <p>Desde ahora ya podes ingresar a tu panel para revisar y actualizar tu informacion.</p>
      <p>
        <a
          href="${loginUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Ingresar a mi panel
        </a>
      </p>
      <p>Si no solicitaste este perfil o tenes alguna duda, podes responder a este correo.</p>
    `,
    text: `${greeting}, tu perfil profesional en Ceres en Red fue aprobado. Podes ingresar desde ${loginUrl}`,
    observability: {
      requestId: observability?.requestId,
      actor: observability?.actor,
      entityType: 'professional',
      entityId: professionalId,
      template: 'email.professional_approved',
      domain: 'admin.professionals.email',
      summary: `Correo de aprobacion solicitado para profesional ${professionalId}`,
    },
  });
}

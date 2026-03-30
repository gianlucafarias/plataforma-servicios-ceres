import { NextRequest } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createEndUserActor, createRequestObservationContext } from '@/lib/observability/context';
import {
  VERIFY_RESEND_RATE_LIMIT,
  normalizeEmailInput,
  resendVerificationEmail,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/auth/verify/resend',
    requestId: meta.requestId,
  });
  const rl = rateLimit(
    `v1:verify-resend:${clientIp(request)}`,
    VERIFY_RESEND_RATE_LIMIT.limit,
    VERIFY_RESEND_RATE_LIMIT.windowMs,
  );

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown };
    const email = normalizeEmailInput(body.email);
    context.actor = createEndUserActor({ email, label: email });

    if (!email) {
      return observedJson(
        context,
        fail('validation_error', 'Email requerido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await resendVerificationEmail(email, {
      requestId: context.requestId,
      actor: context.actor,
    });

    if (result.status === 'not_found') {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.verify_resend',
        status: 'warning',
        summary: `Reenvio de verificacion solicitado para email inexistente: ${email}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
      });

      return observedJson(
        context,
        fail('not_found', 'Usuario no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) },
      );
    }

    if (result.status === 'already_verified') {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.verify_resend',
        status: 'skipped',
        summary: `Reenvio omitido porque la cuenta ${email} ya estaba verificada`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
      });

      return observedJson(
        context,
        ok(
          {
            message: 'La cuenta ya esta verificada',
            alreadyVerified: true,
          },
          meta,
        ),
        { headers: rateLimitHeaders(rl) },
      );
    }

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.verify_resend',
      status: 'success',
      summary: `Correo de verificacion reenviado para ${email}`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
    });

    return observedJson(
      context,
      ok(
        {
          message: 'Correo de verificacion reenviado',
        },
        meta,
      ),
      { headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.verify_resend',
      status: 'failure',
      summary: 'Error durante el reenvio de verificacion',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        error: message,
      },
    });

    return observedJson(context, fail('server_error', message, undefined, meta), {
      status: 500,
      headers: rateLimitHeaders(rl),
    });
  }
}

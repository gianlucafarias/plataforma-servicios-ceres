import { NextRequest } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createEndUserActor, createRequestObservationContext } from '@/lib/observability/context';
import {
  PASSWORD_FORGOT_RATE_LIMIT,
  createPasswordResetRequest,
  normalizeEmailInput,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/auth/password/forgot',
    requestId: meta.requestId,
  });
  const rl = rateLimit(
    `v1:forgot-password:${clientIp(request)}`,
    PASSWORD_FORGOT_RATE_LIMIT.limit,
    PASSWORD_FORGOT_RATE_LIMIT.windowMs,
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
        fail('invalid_email', 'El email es obligatorio.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await createPasswordResetRequest(email, {
      requestId: context.requestId,
      actor: context.actor,
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.password_forgot',
      status: 'success',
      summary: `Solicitud de recuperacion procesada para ${email}`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        userFound: result.userFound,
      },
    });

    return observedJson(
      context,
      ok(
        {
          accepted: true,
          message:
            'Si existe una cuenta asociada, enviaremos un correo de recuperacion.',
        },
        meta,
      ),
      { headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error('[v1 auth/password/forgot] Error:', error);
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.password_forgot',
      status: 'failure',
      summary: 'Error al procesar recuperacion de contrasena',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return observedJson(
      context,
      fail('server_error', 'Error al procesar la solicitud', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}

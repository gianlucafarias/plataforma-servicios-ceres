import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { buildChanges, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createEndUserActor, createRequestObservationContext } from '@/lib/observability/context';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/auth/verify',
    requestId: meta.requestId,
  });
  const rl = rateLimit(`auth-verify:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const { token, email } = await request.json();
    context.actor = createEndUserActor({ email, label: email });

    if (!token || !email) {
      return observedJson(
        context,
        fail('validation_error', 'Datos incompletos', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.verify',
        status: 'warning',
        summary: `Intento de verificacion para email inexistente: ${email}`,
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

    const record = await prisma.verificationToken.findFirst({
      where: { userId: user.id, token },
    });

    if (!record) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.verify',
        status: 'warning',
        summary: `Token de verificacion invalido para usuario ${user.id}`,
        actor: {
          ...context.actor,
          id: user.id,
        },
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'user',
        entityId: user.id,
      });

      return observedJson(
        context,
        fail('invalid_token', 'Token invalido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.verify',
        status: 'warning',
        summary: `Token de verificacion expirado para usuario ${user.id}`,
        actor: {
          ...context.actor,
          id: user.id,
        },
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'user',
        entityId: user.id,
      });

      return observedJson(
        context,
        fail('expired_token', 'Token expirado', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { verified: true, emailVerifiedAt: new Date() },
      });
      await tx.verificationToken.delete({ where: { id: record.id } });
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.verify',
      status: 'success',
      summary: `Cuenta ${user.id} verificada`,
      actor: {
        ...context.actor,
        id: user.id,
      },
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'user',
      entityId: user.id,
      changes: buildChanges(
        { verified: user.verified, emailVerifiedAt: user.emailVerifiedAt },
        { verified: true, emailVerifiedAt: new Date() },
      ),
    });

    return observedJson(context, ok({ message: 'Cuenta verificada' }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor';
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.verify',
      status: 'failure',
      summary: 'Error durante la verificacion de cuenta',
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

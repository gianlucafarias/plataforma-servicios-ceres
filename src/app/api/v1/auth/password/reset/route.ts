import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { buildChanges, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createEndUserActor, createRequestObservationContext } from '@/lib/observability/context';

const LIMIT = 20;
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
    route: '/api/v1/auth/password/reset',
    requestId: meta.requestId,
  });
  const rl = rateLimit(`password-reset:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return observedJson(
        context,
        fail('invalid_payload', 'Payload invalido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    if (password.length < 8) {
      return observedJson(
        context,
        fail('weak_password', 'La contrasena debe tener al menos 8 caracteres.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.password_reset',
        status: 'warning',
        summary: 'Intento de reset con token invalido',
        requestId: context.requestId,
        route: context.route,
        method: context.method,
      });

      return observedJson(
        context,
        fail('invalid_token', 'El enlace no es valido o ya fue usado.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    context.actor = createEndUserActor({
      userId: verification.userId,
      email: verification.user.email,
      label: verification.user.email,
    });

    if (verification.expiresAt < new Date()) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.password_reset',
        status: 'warning',
        summary: `Intento de reset con token expirado para usuario ${verification.userId}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'user',
        entityId: verification.userId,
      });

      return observedJson(
        context,
        fail('expired_token', 'El enlace de recuperacion expiro. Pedi uno nuevo.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user) {
      return observedJson(
        context,
        fail('user_not_found', 'Usuario no encontrado.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    if (!user.password) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.password_reset',
        status: 'skipped',
        summary: `Reset omitido para usuario OAuth ${user.id}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'user',
        entityId: user.id,
      });

      return observedJson(
        context,
        fail('oauth_only', 'Esta cuenta usa inicio de sesion social. Usa ese metodo.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const updatedAt = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          updatedAt,
        },
      }),
      prisma.verificationToken.delete({
        where: { id: verification.id },
      }),
    ]);

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.password_reset',
      status: 'success',
      summary: `Contrasena restablecida para usuario ${user.id}`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'user',
      entityId: user.id,
      changes: buildChanges(
        { password: '[REDACTED]', updatedAt: user.updatedAt },
        { password: '[REDACTED]', updatedAt },
      ),
    });

    return observedJson(context, ok({ success: true }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error('Error en reset password (v1):', error);
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.password_reset',
      status: 'failure',
      summary: 'Error al resetear contrasena',
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
      fail('server_error', 'Error al resetear contrasena', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createEndUserActor, createRequestObservationContext } from '@/lib/observability/context';
import {
  SERVICES_WRITE_RATE_LIMIT,
  ServiceFlowError,
  deleteOwnedService,
  updateOwnedService,
} from '@/lib/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/services/[id]',
    requestId: meta.requestId,
  });
  const rl = rateLimit(
    `v1:services:update:${id}:${clientIp(request)}`,
    SERVICES_WRITE_RATE_LIMIT.limit,
    SERVICES_WRITE_RATE_LIMIT.windowMs,
  );

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return observedJson(
        context,
        fail('unauthorized', 'No autorizado', undefined, meta),
        { status: 401, headers: rateLimitHeaders(rl) },
      );
    }

    context.actor = createEndUserActor({
      userId: session.user.id,
      email: session.user.email ?? null,
      label: session.user.name ?? session.user.email ?? session.user.id,
    });

    const body = await request.json();
    const updated = await updateOwnedService(id, session.user.id, body, {
      requestId: context.requestId,
      actor: context.actor,
      route: context.route,
      method: context.method,
    });

    return observedJson(context, ok(updated, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'services',
        eventName: 'service.update',
        status: 'warning',
        summary: `Fallo al actualizar servicio ${id}: ${error.message}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'service',
        entityId: id,
        metadata: {
          code: error.code,
        },
      });

      return observedJson(
        context,
        fail(error.code, error.message, undefined, meta),
        { status: error.status, headers: rateLimitHeaders(rl) },
      );
    }

    console.error('PATCH /api/v1/services/[id] error:', error);
    return observedJson(
      context,
      fail('server_error', 'Error al actualizar servicio', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/services/[id]',
    requestId: meta.requestId,
  });
  const rl = rateLimit(
    `v1:services:delete:${id}:${clientIp(request)}`,
    SERVICES_WRITE_RATE_LIMIT.limit,
    SERVICES_WRITE_RATE_LIMIT.windowMs,
  );

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return observedJson(
        context,
        fail('unauthorized', 'No autorizado', undefined, meta),
        { status: 401, headers: rateLimitHeaders(rl) },
      );
    }

    context.actor = createEndUserActor({
      userId: session.user.id,
      email: session.user.email ?? null,
      label: session.user.name ?? session.user.email ?? session.user.id,
    });

    await deleteOwnedService(id, session.user.id, {
      requestId: context.requestId,
      actor: context.actor,
      route: context.route,
      method: context.method,
    });

    return observedJson(context, ok({ deleted: true }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'services',
        eventName: 'service.delete',
        status: 'warning',
        summary: `Fallo al eliminar servicio ${id}: ${error.message}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'service',
        entityId: id,
        metadata: {
          code: error.code,
        },
      });

      return observedJson(
        context,
        fail(error.code, error.message, undefined, meta),
        { status: error.status, headers: rateLimitHeaders(rl) },
      );
    }

    console.error('DELETE /api/v1/services/[id] error:', error);
    return observedJson(
      context,
      fail('server_error', 'Error al eliminar servicio', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}

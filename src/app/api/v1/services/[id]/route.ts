import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  SERVICES_WRITE_RATE_LIMIT,
  ServiceFlowError,
  deleteOwnedService,
  updateOwnedService,
} from '@/lib/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:services:update:${id}:${clientIp(request)}`,
    SERVICES_WRITE_RATE_LIMIT.limit,
    SERVICES_WRITE_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        fail('unauthorized', 'No autorizado', undefined, meta),
        { status: 401, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const updated = await updateOwnedService(id, session.user.id, body);

    return NextResponse.json(ok(updated, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        fail(error.code, error.message, undefined, meta),
        { status: error.status, headers: rateLimitHeaders(rl) }
      );
    }

    console.error('PATCH /api/v1/services/[id] error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al actualizar servicio', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:services:delete:${id}:${clientIp(request)}`,
    SERVICES_WRITE_RATE_LIMIT.limit,
    SERVICES_WRITE_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        fail('unauthorized', 'No autorizado', undefined, meta),
        { status: 401, headers: rateLimitHeaders(rl) }
      );
    }

    await deleteOwnedService(id, session.user.id);

    return NextResponse.json(ok({ deleted: true }, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        fail(error.code, error.message, undefined, meta),
        { status: error.status, headers: rateLimitHeaders(rl) }
      );
    }

    console.error('DELETE /api/v1/services/[id] error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al eliminar servicio', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

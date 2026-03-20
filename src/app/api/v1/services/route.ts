import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  SERVICES_LIST_RATE_LIMIT,
  SERVICES_WRITE_RATE_LIMIT,
  ServiceFlowError,
  createServiceForUser,
  listPublicServices,
} from '@/lib/server/services';

export async function GET(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(
    `services:list:${clientIp(request)}`,
    SERVICES_LIST_RATE_LIMIT.limit,
    SERVICES_LIST_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const result = await listPublicServices(request.url);
    const meta = {
      ...metaBase,
      pagination: {
        page: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    };

    return NextResponse.json(ok(result.data, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('List services v1 error:', error);

    const message =
      error instanceof Error && error.message
        ? `Error al obtener servicios. Detalle: ${error.message}`
        : 'Error al obtener servicios';

    return NextResponse.json(fail('fetch_failed', message, undefined, metaBase), {
      status: 500,
      headers: rateLimitHeaders(rl),
    });
  }
}

export async function POST(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(
    `services:create:${clientIp(request)}`,
    SERVICES_WRITE_RATE_LIMIT.limit,
    SERVICES_WRITE_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        fail('unauthorized', 'No autorizado', undefined, metaBase),
        { status: 401, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const created = await createServiceForUser(session.user.id, body);

    return NextResponse.json(ok(created, metaBase), {
      status: 201,
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        fail(error.code, error.message, undefined, metaBase),
        { status: error.status, headers: rateLimitHeaders(rl) }
      );
    }

    console.error('POST /api/v1/services error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al crear servicio', undefined, metaBase),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

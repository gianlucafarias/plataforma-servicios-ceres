import { NextRequest, NextResponse } from 'next/server';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  PROFESSIONALS_LIST_RATE_LIMIT,
  listPublicProfessionals,
} from '@/lib/server/public-professionals';

export async function GET(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(
    `professionals:${clientIp(request)}`,
    PROFESSIONALS_LIST_RATE_LIMIT.limit,
    PROFESSIONALS_LIST_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const result = await listPublicProfessionals(request.url, {
      includeServiceLocations: true,
    });

    return NextResponse.json(
      ok(result.data, {
        ...metaBase,
        pagination: result.pagination,
      }),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Get professionals v1 error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener profesionales', undefined, metaBase),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

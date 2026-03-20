import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { SERVICES_STATS_RATE_LIMIT, getServiceCounts } from '@/lib/server/services';

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:services:stats:${clientIp(request)}`,
    SERVICES_STATS_RATE_LIMIT.limit,
    SERVICES_STATS_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const countsBySlug = await getServiceCounts();
    return NextResponse.json(ok(countsBySlug, meta), {
      headers: {
        ...rateLimitHeaders(rl),
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('GET /api/v1/services/stats error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener estadisticas de servicios', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

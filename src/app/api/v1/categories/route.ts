import { NextResponse } from 'next/server';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { CATEGORIES_LIST_RATE_LIMIT, getPublicCategoryTree } from '@/lib/server/categories';

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `categories:${clientIp(request)}`,
    CATEGORIES_LIST_RATE_LIMIT.limit,
    CATEGORIES_LIST_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const data = await getPublicCategoryTree();
    return NextResponse.json(ok(data, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error obteniendo categorias (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener categorias', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

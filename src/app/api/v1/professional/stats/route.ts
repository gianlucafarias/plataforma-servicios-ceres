import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { getProfessionalStats } from '@/lib/server/professional-dashboard';

const RL_GET = { limit: 120, windowMs: 5 * 60 * 1000 };

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(`v1:professional-stats:${clientIp(request)}`, RL_GET.limit, RL_GET.windowMs);

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

    const stats = await getProfessionalStats(session.user.id);
    if (!stats) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(ok(stats, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error en GET /api/v1/professional/stats:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener estadisticas', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

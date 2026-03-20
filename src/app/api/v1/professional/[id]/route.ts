import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  getProfessionalProfileContext,
  toProfessionalPublicApiProfile,
} from '@/lib/server/professional-profile';

const RL_LIMIT = 120;
const RL_WINDOW_MS = 5 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const meta = requestMeta(request);
  const rl = rateLimit(`v1:professional-detail:${clientIp(request)}`, RL_LIMIT, RL_WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const context = await getProfessionalProfileContext(id, session?.user?.id);

    if (!context.found) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(ok(toProfessionalPublicApiProfile(context), meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error('GET /api/v1/professional/[id] error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener profesional', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

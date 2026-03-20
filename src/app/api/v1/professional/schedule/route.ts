import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  ProfessionalDashboardError,
  updateProfessionalDashboardProfile,
} from '@/lib/server/professional-dashboard';

const RL_PUT = { limit: 30, windowMs: 10 * 60 * 1000 };

export async function PUT(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(`v1:professional-schedule:${clientIp(request)}`, RL_PUT.limit, RL_PUT.windowMs);

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
    const profile = await updateProfessionalDashboardProfile(session.user.id, {
      schedule: body.schedule ?? null,
    });

    if (!profile) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok(
        {
          message: 'Horarios actualizados correctamente',
          profile,
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof ProfessionalDashboardError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error('Error en PUT /api/v1/professional/schedule:', error);
    return NextResponse.json(
      fail('server_error', 'Error al actualizar horarios', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

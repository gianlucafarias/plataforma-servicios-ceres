import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  ProfessionalDashboardError,
  getProfessionalDashboardProfile,
  updateProfessionalDashboardProfile,
} from '@/lib/server/professional-dashboard';

const RL_GET = { limit: 120, windowMs: 5 * 60 * 1000 };
const RL_PUT = { limit: 30, windowMs: 10 * 60 * 1000 };

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(`v1:professional-me:get:${clientIp(request)}`, RL_GET.limit, RL_GET.windowMs);

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

    const profile = await getProfessionalDashboardProfile(session.user.id);
    if (!profile) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(ok(profile, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error en GET /api/v1/professional/me:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener el perfil profesional', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

export async function PUT(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(`v1:professional-me:put:${clientIp(request)}`, RL_PUT.limit, RL_PUT.windowMs);

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

    const profile = await updateProfessionalDashboardProfile(session.user.id, await request.json());
    if (!profile) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok(
        {
          message: 'Perfil actualizado correctamente',
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

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        fail('validation_error', 'El email ya esta en uso por otro usuario', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    console.error('Error en PUT /api/v1/professional/me:', error);
    return NextResponse.json(
      fail('server_error', 'Error al actualizar el perfil profesional', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

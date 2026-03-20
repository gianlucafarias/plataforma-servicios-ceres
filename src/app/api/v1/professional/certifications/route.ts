import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  ProfessionalDashboardError,
  createProfessionalCertification,
  listProfessionalCertifications,
} from '@/lib/server/professional-dashboard';

const RL_GET = { limit: 120, windowMs: 5 * 60 * 1000 };
const RL_POST = { limit: 30, windowMs: 10 * 60 * 1000 };

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:professional-certifications:get:${clientIp(request)}`,
    RL_GET.limit,
    RL_GET.windowMs
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

    const certifications = await listProfessionalCertifications(session.user.id);
    if (!certifications) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(ok(certifications, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error en GET /api/v1/professional/certifications:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener certificaciones', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:professional-certifications:post:${clientIp(request)}`,
    RL_POST.limit,
    RL_POST.windowMs
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

    const certification = await createProfessionalCertification(
      session.user.id,
      await request.json()
    );

    if (!certification) {
      return NextResponse.json(
        fail('not_found', 'Profesional no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok(
        {
          message: 'Certificacion enviada para revision',
          certification,
        },
        meta
      ),
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof ProfessionalDashboardError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error('Error en POST /api/v1/professional/certifications:', error);
    return NextResponse.json(
      fail('server_error', 'Error al crear certificacion', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

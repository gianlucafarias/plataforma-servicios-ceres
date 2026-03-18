import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { createUploadGrant } from '@/lib/upload-grant';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`upload-grant:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'rate_limited',
        message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.',
      },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = (await request.json()) as { context?: string; type?: string };

    if (body.context !== 'register' || (body.type !== 'image' && body.type !== 'cv')) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_payload',
          message: 'Se requiere context=register y type=image|cv.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const grant = createUploadGrant({
      context: 'register',
      type: body.type,
    });

    return NextResponse.json(
      {
        success: true,
        token: grant.token,
        expiresAt: grant.expiresAt,
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando upload grant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo generar el token de upload.',
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_GRANT_RATE_LIMIT,
  UploadFlowError,
  createRegisterUploadGrantFromPayload,
} from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `upload-grant:${clientIp(request)}`,
    UPLOAD_GRANT_RATE_LIMIT.limit,
    UPLOAD_GRANT_RATE_LIMIT.windowMs
  );
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
    const grant = createRegisterUploadGrantFromPayload(await request.json());

    return NextResponse.json(
      {
        success: true,
        token: grant.token,
        expiresAt: grant.expiresAt,
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof UploadFlowError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: error.status, headers: rateLimitHeaders(rl) }
      );
    }

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

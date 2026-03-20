import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_GRANT_RATE_LIMIT,
  UploadFlowError,
  createRegisterUploadGrantFromPayload,
} from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:upload-grant:${clientIp(request)}`,
    UPLOAD_GRANT_RATE_LIMIT.limit,
    UPLOAD_GRANT_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const grant = createRegisterUploadGrantFromPayload(await request.json());
    return NextResponse.json(
      ok(
        {
          token: grant.token,
          expiresAt: grant.expiresAt,
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof UploadFlowError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error('Error creando upload grant (v1):', error);
    return NextResponse.json(
      fail('server_error', 'No se pudo generar el token de upload.', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

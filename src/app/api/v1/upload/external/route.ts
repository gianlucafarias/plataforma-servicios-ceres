import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_EXTERNAL_RATE_LIMIT,
  UploadFlowError,
  processExternalOAuthUpload,
} from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:upload-external:${clientIp(request)}`,
    UPLOAD_EXTERNAL_RATE_LIMIT.limit,
    UPLOAD_EXTERNAL_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const result = await processExternalOAuthUpload({
      sessionUserId: session?.user?.id,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json(ok(result, meta), {
      status: 201,
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    if (error instanceof UploadFlowError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error('Error al descargar imagen externa (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error al descargar la imagen', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

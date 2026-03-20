import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_EXTERNAL_RATE_LIMIT,
  UploadFlowError,
  processExternalOAuthUpload,
} from '@/lib/server/uploads';

/**
 * Endpoint para descargar y guardar imagenes externas (OAuth) en R2.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `upload-external:${clientIp(request)}`,
    UPLOAD_EXTERNAL_RATE_LIMIT.limit,
    UPLOAD_EXTERNAL_RATE_LIMIT.windowMs
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
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const result = await processExternalOAuthUpload({
      sessionUserId: session?.user?.id,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        value: result.value,
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof UploadFlowError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status, headers: rateLimitHeaders(rl) }
      );
    }

    console.error('Error al descargar imagen externa:', error);
    const message = error instanceof Error ? error.message : 'Error al descargar la imagen';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

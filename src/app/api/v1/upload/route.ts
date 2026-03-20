import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_RATE_LIMIT,
  UploadFlowError,
  processProfileUpload,
} from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:upload:${clientIp(request)}`,
    UPLOAD_RATE_LIMIT.limit,
    UPLOAD_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const data = await request.formData();
    const session = await getServerSession(authOptions);
    const upload = await processProfileUpload({
      file: data.get('file') as File | null,
      typeHint: data.get('type'),
      sessionUserId: session?.user?.id,
      uploadGrantToken: request.headers.get('x-upload-token'),
    });

    return NextResponse.json(ok(upload, meta), {
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

    console.error('Error uploading file (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Failed to upload file', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

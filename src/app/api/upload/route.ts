import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  UPLOAD_RATE_LIMIT,
  UploadFlowError,
  processProfileUpload,
} from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `upload:${clientIp(request)}`,
    UPLOAD_RATE_LIMIT.limit,
    UPLOAD_RATE_LIMIT.windowMs
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
    const data = await request.formData();
    const session = await getServerSession(authOptions);
    const result = await processProfileUpload({
      file: data.get('file') as File | null,
      typeHint: data.get('type'),
      sessionUserId: session?.user?.id,
      uploadGrantToken: request.headers.get('x-upload-token'),
    });

    return NextResponse.json(
      {
        success: true,
        filename: result.filename,
        originalName: result.originalName,
        path: result.path,
        url: result.url,
        value: result.value,
        storage: result.storage,
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

    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (process.env.NODE_ENV === 'production') {
      console.error('Upload error details:', {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        ...(process.env.NODE_ENV !== 'production' && { details: errorMessage }),
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

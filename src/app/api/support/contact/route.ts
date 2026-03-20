import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  SUPPORT_CONTACT_RATE_LIMIT,
  createSupportContactSubmission,
  validateSupportContactPayload,
} from '@/lib/server/support-submissions';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `support-contact:${clientIp(request)}`,
    SUPPORT_CONTACT_RATE_LIMIT.limit,
    SUPPORT_CONTACT_RATE_LIMIT.windowMs
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
    const body = await request.json();
    const validation = validateSupportContactPayload(body);

    if (validation.kind === 'ignored') {
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: validation.message,
        },
        { status: 200, headers: rateLimitHeaders(rl) }
      );
    }

    if (validation.kind === 'error') {
      return NextResponse.json(
        {
          success: false,
          error: validation.code,
          message: validation.message,
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const report = await createSupportContactSubmission(validation.data);

    return NextResponse.json(
      {
        success: true,
        data: { id: report.id },
        message: 'Tu mensaje fue enviado. Gracias por contactarnos.',
      },
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando contacto de soporte:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo enviar tu mensaje. Intenta nuevamente mas tarde.',
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

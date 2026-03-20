import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  SUPPORT_CONTACT_RATE_LIMIT,
  createSupportContactSubmission,
  validateSupportContactPayload,
} from '@/lib/server/support-submissions';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:support-contact:${clientIp(request)}`,
    SUPPORT_CONTACT_RATE_LIMIT.limit,
    SUPPORT_CONTACT_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json();
    const validation = validateSupportContactPayload(body);

    if (validation.kind === 'ignored') {
      return NextResponse.json(
        ok(
          {
            ignored: true,
            message: validation.message,
          },
          meta
        ),
        { headers: rateLimitHeaders(rl) }
      );
    }

    if (validation.kind === 'error') {
      return NextResponse.json(
        fail(validation.code, validation.message, undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const report = await createSupportContactSubmission(validation.data);

    return NextResponse.json(
      ok(
        {
          id: report.id,
          message: 'Tu mensaje fue enviado. Gracias por contactarnos.',
        },
        meta
      ),
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando contacto de soporte (v1):', error);
    return NextResponse.json(
      fail('server_error', 'No se pudo enviar tu mensaje. Intenta nuevamente mas tarde.', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

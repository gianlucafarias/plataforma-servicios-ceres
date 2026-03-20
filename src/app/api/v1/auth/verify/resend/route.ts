import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  VERIFY_RESEND_RATE_LIMIT,
  normalizeEmailInput,
  resendVerificationEmail,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:verify-resend:${clientIp(request)}`,
    VERIFY_RESEND_RATE_LIMIT.limit,
    VERIFY_RESEND_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown };
    const email = normalizeEmailInput(body.email);

    if (!email) {
      return NextResponse.json(
        fail('validation_error', 'Email requerido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await resendVerificationEmail(email);

    if (result.status === 'not_found') {
      return NextResponse.json(
        fail('not_found', 'Usuario no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    if (result.status === 'already_verified') {
      return NextResponse.json(
        ok(
          {
            message: 'La cuenta ya esta verificada',
            alreadyVerified: true,
          },
          meta
        ),
        { headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok(
        {
          message: 'Correo de verificacion reenviado',
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(fail('server_error', message, undefined, meta), {
      status: 500,
      headers: rateLimitHeaders(rl),
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  VERIFY_RESEND_RATE_LIMIT,
  normalizeEmailInput,
  resendVerificationEmail,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `verify-resend:${clientIp(request)}`,
    VERIFY_RESEND_RATE_LIMIT.limit,
    VERIFY_RESEND_RATE_LIMIT.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown };
    const email = normalizeEmailInput(body.email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await resendVerificationEmail(email);

    if (result.status === 'not_found') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    if (result.status === 'already_verified') {
      return NextResponse.json(
        { message: 'La cuenta ya esta verificada' },
        { headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      { message: 'Correo de verificacion reenviado' },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

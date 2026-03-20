import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  PASSWORD_FORGOT_RATE_LIMIT,
  createPasswordResetRequest,
  normalizeEmailInput,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:forgot-password:${clientIp(request)}`,
    PASSWORD_FORGOT_RATE_LIMIT.limit,
    PASSWORD_FORGOT_RATE_LIMIT.windowMs
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
        fail('invalid_email', 'El email es obligatorio.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    await createPasswordResetRequest(email);

    return NextResponse.json(
      ok(
        {
          accepted: true,
          message:
            'Si existe una cuenta asociada, enviaremos un correo de recuperacion.',
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('[v1 auth/password/forgot] Error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al procesar la solicitud', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

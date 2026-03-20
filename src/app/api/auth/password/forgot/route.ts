import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  PASSWORD_FORGOT_RATE_LIMIT,
  createPasswordResetRequest,
  normalizeEmailInput,
} from '@/lib/server/auth-recovery';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `forgot-password:${clientIp(request)}`,
    PASSWORD_FORGOT_RATE_LIMIT.limit,
    PASSWORD_FORGOT_RATE_LIMIT.windowMs
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
    const body = (await request.json()) as { email?: unknown };
    const email = normalizeEmailInput(body.email);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'invalid_email' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    await createPasswordResetRequest(email);

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('[forgot-password] Error en endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

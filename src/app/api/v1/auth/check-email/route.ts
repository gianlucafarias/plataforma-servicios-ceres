import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  CHECK_EMAIL_RATE_LIMIT,
  checkEmailExists,
  normalizeLookupEmail,
} from '@/lib/server/check-email';

function checkEmailRateLimit(request: NextRequest) {
  return rateLimit(
    `v1:check-email:${clientIp(request)}`,
    CHECK_EMAIL_RATE_LIMIT.limit,
    CHECK_EMAIL_RATE_LIMIT.windowMs
  );
}

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = checkEmailRateLimit(request);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const email = normalizeLookupEmail(new URL(request.url).searchParams.get('email'));
    if (!email) {
      return NextResponse.json(
        fail('validation_error', 'Email requerido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok({ exists: await checkEmailExists(email) }, meta),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error en v1 check-email (GET):', error);
    return NextResponse.json(
      fail('server_error', 'Error del servidor', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = checkEmailRateLimit(request);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json();
    const email = normalizeLookupEmail(body.email);
    if (!email) {
      return NextResponse.json(
        fail('validation_error', 'Email requerido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    return NextResponse.json(
      ok({ exists: await checkEmailExists(email) }, meta),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error en v1 check-email (POST):', error);
    return NextResponse.json(
      fail('server_error', 'Error del servidor', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

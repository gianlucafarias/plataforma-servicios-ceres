import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  CHECK_EMAIL_RATE_LIMIT,
  checkEmailExists,
  normalizeLookupEmail,
} from '@/lib/server/check-email';

function rateLimitResponse(request: NextRequest) {
  const rl = rateLimit(
    `check-email:${clientIp(request)}`,
    CHECK_EMAIL_RATE_LIMIT.limit,
    CHECK_EMAIL_RATE_LIMIT.windowMs
  );
  if (!rl.allowed) {
    return {
      headers: rateLimitHeaders(rl),
      response: NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta nuevamente más tarde." },
        { status: 429, headers: rateLimitHeaders(rl) }
      ),
    };
  }

  return {
    headers: rateLimitHeaders(rl),
    response: null,
  };
}

export async function GET(request: NextRequest) {
  const { headers, response } = rateLimitResponse(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeLookupEmail(searchParams.get("email"));

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400, headers });
    }

    return NextResponse.json({ exists: await checkEmailExists(email) }, { headers });
  } catch (error) {
    console.error("Error en check-email (GET):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500, headers });
  }
}

export async function POST(request: NextRequest) {
  const { headers, response } = rateLimitResponse(request);
  if (response) return response;

  try {
    const body = await request.json();
    const email = normalizeLookupEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400, headers });
    }

    return NextResponse.json({ exists: await checkEmailExists(email) }, { headers });
  } catch (error) {
    console.error("Error en check-email (POST):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500, headers });
  }
}

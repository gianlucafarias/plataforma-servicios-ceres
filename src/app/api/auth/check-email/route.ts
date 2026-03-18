import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimitResponse(request: NextRequest) {
  const rl = rateLimit(`check-email:${clientIp(request)}`, LIMIT, WINDOW_MS);
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
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400, headers });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    return NextResponse.json({ exists: !!user }, { headers });
  } catch (error) {
    console.error("Error en check-email (GET):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500, headers });
  }
}

export async function POST(request: NextRequest) {
  const { headers, response } = rateLimitResponse(request);
  if (response) return response;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400, headers });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    return NextResponse.json({ exists: !!user }, { headers });
  } catch (error) {
    console.error("Error en check-email (POST):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500, headers });
  }
}

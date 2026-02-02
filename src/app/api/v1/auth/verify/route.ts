import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000; // 10 min

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(`auth-verify:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { token, email } = await request.json();
    if (!token || !email) {
      return NextResponse.json(
        fail('validation_error', 'Datos incompletos', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        fail('not_found', 'Usuario no encontrado', undefined, meta),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    const record = await prisma.verificationToken.findFirst({
      where: { userId: user.id, token },
    });

    if (!record) {
      return NextResponse.json(
        fail('invalid_token', 'Token inválido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
      return NextResponse.json(
        fail('expired_token', 'Token expirado', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { verified: true, emailVerifiedAt: new Date() },
      });
      await tx.verificationToken.delete({ where: { id: record.id } });
    });

    return NextResponse.json(ok({ message: 'Cuenta verificada' }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor';
    return NextResponse.json(fail('server_error', message, undefined, meta), {
      status: 500,
      headers: rateLimitHeaders(rl),
    });
  }
}

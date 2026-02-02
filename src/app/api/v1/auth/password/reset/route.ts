import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const LIMIT = 20;
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
  const rl = rateLimit(`password-reset:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        fail('invalid_payload', 'Payload inválido', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        fail('weak_password', 'La contraseña debe tener al menos 8 caracteres.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json(
        fail('invalid_token', 'El enlace no es válido o ya fue usado.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        fail('expired_token', 'El enlace de recuperación expiró. Pedí uno nuevo.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user) {
      return NextResponse.json(
        fail('user_not_found', 'Usuario no encontrado.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        fail('oauth_only', 'Esta cuenta usa inicio de sesión social. Usa ese método.', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          updatedAt: new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { id: verification.id },
      }),
    ]);

    return NextResponse.json(ok({ success: true }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error('Error en reset password (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error al resetear contraseña', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

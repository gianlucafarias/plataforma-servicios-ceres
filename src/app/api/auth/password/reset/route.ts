import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`reset-password:${clientIp(request)}`, LIMIT, WINDOW_MS);
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
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'invalid_payload' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'weak_password',
          message: 'La contrasena debe tener al menos 8 caracteres.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_token',
          message: 'El enlace no es valido o ya fue usado.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'expired_token',
          message: 'El enlace de recuperacion expiro. Pedi uno nuevo.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'user_not_found' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'oauth_only',
          message: 'Esta cuenta usa inicio de sesion con Google o Facebook. Usa ese metodo para ingresar.',
        },
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

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error en reset password:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

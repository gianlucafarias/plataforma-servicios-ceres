import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { sendMail } from '@/lib/mail';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`verify-resend:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    if (user.verified) {
      return NextResponse.json(
        { message: 'La cuenta ya esta verificada' },
        { headers: rateLimitHeaders(rl) }
      );
    }

    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const token = generateRandomToken(48);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.verificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
    const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    try {
      await sendMail({
        to: email,
        subject: 'Reenvio: Confirma tu cuenta - Ceres en Red',
        html: `
          <p>Para activar tu cuenta, hace clic en el siguiente enlace:</p>
          <p><a href="${verifyUrl}">Confirmar mi cuenta</a></p>
          <p>Este enlace vence en 24 horas.</p>
        `,
        text: `Confirma tu cuenta ingresando a: ${verifyUrl}`,
      });
    } catch (error) {
      console.error('Error reenviando correo:', error);
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

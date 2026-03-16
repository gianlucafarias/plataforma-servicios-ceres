import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getAbsoluteUrl } from '@/lib/seo';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`forgot-password:${clientIp(request)}`, LIMIT, WINDOW_MS);
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
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'invalid_email' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, password: true },
    });

    if (!user || !user.password) {
      console.log('[forgot-password] No user or no password for email', email);
      return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetUrl = getAbsoluteUrl(`/auth/reset-password?token=${token}`);
    console.log('[forgot-password] Generated reset URL:', resetUrl);

    if (process.env.RESEND_API_KEY) {
      try {
        const result = await resend.emails.send({
          from: 'Ceres en Red <no-reply@ceresenred.ceres.gob.ar>',
          to: user.email,
          subject: 'Restablecer tu contrasena - Ceres en Red',
          html: `
          <p>Hola ${user.firstName || ''},</p>
          <p>Recibimos un pedido para restablecer tu contrasena en <strong>Ceres en Red</strong>.</p>
          <p>Hace clic en el siguiente boton para crear una nueva contrasena:</p>
          <p>
            <a href="${resetUrl}" 
               style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
              Restablecer contrasena
            </a>
          </p>
          <p>Si no fuiste vos, podes ignorar este correo.</p>
          <p>Este enlace sera valido por 1 hora.</p>
        `,
        });
        console.log('[forgot-password] Resend response:', result);
      } catch (emailError) {
        console.error('[forgot-password] Error enviando email con Resend:', emailError);
      }
    } else {
      console.warn('[forgot-password] RESEND_API_KEY no esta configurada. No se envio el email.');
    }

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('[forgot-password] Error en endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
